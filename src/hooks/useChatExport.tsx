import { useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { MessageType } from '@/components/ChatInterface';
import { supabase } from '@/integrations/supabase/client';

interface ExportChatParams {
  messages: MessageType[];
  chatTitle: string;
  mode: string;
  createdAt: string;
  chatId: string;
  selectedMode?: string;
  selectedModel?: string;
  userName?: string;
  userEmail?: string;
}

export const useChatExport = () => {
  const checkExportPermission = async (): Promise<{ allowed: boolean; message?: string }> => {
    const { data: setting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'export_permission')
      .single();
    const level = (setting?.value as { level?: string } | null)?.level ?? 'all';
    if (level !== 'admin_only') return { allowed: true };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { allowed: false, message: 'Not authenticated.' };
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = (profile as { role?: string } | null)?.role;
    if (role === 'admin' || role === 'superadmin') return { allowed: true };
    return { allowed: false, message: 'Exports are restricted to admins on this platform.' };
  };

  const logExportAudit = async (format: string, chatId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('security_audit_log').insert({
      event_type: 'export_performed',
      actor_user_id: user.id,
      target_resource: chatId,
      severity: 'info',
      metadata: { format }
    });
  };

  const formatMode = (mode: string) => {
    const modeMap: Record<string, string> = {
      coach: 'Coach Mode',
      coachAlpha: 'Coach Alpha Mode',
      family: 'Family Mode',
      ambassador: 'Ambassador Mode',
      faith: 'Faith Mode'
    };
    return modeMap[mode] || mode;
  };

  const wrapText = (text: string, maxWidth: number, font: any, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const exportToPDF = useCallback(async ({
    messages,
    chatTitle,
    mode,
    createdAt,
    chatId,
    userName,
    userEmail
  }: ExportChatParams) => {
    const permission = await checkExportPermission();
    if (!permission.allowed) return { success: false, error: permission.message };
    try {
      console.log('🔄 Starting PDF export with pdf-lib...');

      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 612; // Letter size
      const pageHeight = 792;
      const margin = 50;
      const contentWidth = pageWidth - 2 * margin;
      const lineHeight = 14;
      const headerColor = rgb(0.145, 0.388, 0.922); // Blue brand color
      const textColor = rgb(0.1, 0.1, 0.1);
      const mutedColor = rgb(0.4, 0.4, 0.4);

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let yPosition = pageHeight - margin;

      const addNewPage = () => {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      };

      const checkPageBreak = (neededHeight: number) => {
        if (yPosition - neededHeight < margin + 30) {
          // Add page number before new page
          currentPage.drawText(`Page ${pdfDoc.getPageCount()}`, {
            x: pageWidth / 2 - 20,
            y: 25,
            size: 10,
            font: helvetica,
            color: mutedColor
          });
          addNewPage();
        }
      };

      // === HEADER ===
      // Blue header background
      currentPage.drawRectangle({
        x: 0,
        y: pageHeight - 120,
        width: pageWidth,
        height: 120,
        color: headerColor
      });

      // Title
      currentPage.drawText('DARYLE AI', {
        x: margin,
        y: pageHeight - 50,
        size: 28,
        font: helveticaBold,
        color: rgb(1, 1, 1)
      });

      currentPage.drawText('Executive Coaching Session Report', {
        x: margin,
        y: pageHeight - 75,
        size: 14,
        font: helvetica,
        color: rgb(0.9, 0.9, 1)
      });

      currentPage.drawText('Confidential and Proprietary', {
        x: margin,
        y: pageHeight - 95,
        size: 10,
        font: helvetica,
        color: rgb(0.7, 0.8, 1)
      });

      yPosition = pageHeight - 150;

      // === SESSION INFO BOX ===
      const boxHeight = 80;
      currentPage.drawRectangle({
        x: margin,
        y: yPosition - boxHeight,
        width: contentWidth,
        height: boxHeight,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
        color: rgb(0.97, 0.97, 0.97)
      });

      const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      const sessionInfo = [
        { label: 'Session:', value: chatTitle },
        { label: 'Mode:', value: formatMode(mode) },
        { label: 'Date:', value: formattedDate },
        { label: 'Session ID:', value: chatId.substring(0, 8) }
      ];

      let infoY = yPosition - 18;
      sessionInfo.forEach(info => {
        currentPage.drawText(info.label, {
          x: margin + 10,
          y: infoY,
          size: 10,
          font: helveticaBold,
          color: textColor
        });
        currentPage.drawText(info.value, {
          x: margin + 80,
          y: infoY,
          size: 10,
          font: helvetica,
          color: textColor
        });
        infoY -= 16;
      });

      yPosition -= boxHeight + 30;

      // === TRANSCRIPT HEADER ===
      currentPage.drawText('Session Transcript', {
        x: margin,
        y: yPosition,
        size: 16,
        font: helveticaBold,
        color: textColor
      });

      yPosition -= 10;

      currentPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });

      yPosition -= 25;

      // === MESSAGES ===
      for (const message of messages) {
        const isUser = message.sender === 'user';
        const senderLabel = isUser ? 'Client:' : 'Daryle AI Coach:';
        const senderColor = isUser ? rgb(0.2, 0.4, 0.8) : headerColor;

        // Clean markdown from content
        const cleanContent = message.content
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/#{1,6}\s/g, '');

        // Split content into paragraphs
        const paragraphs = cleanContent.split('\n').filter(p => p.trim());

        // Calculate approximate height needed
        let estimatedHeight = 30; // sender label + spacing
        paragraphs.forEach(para => {
          const lines = wrapText(para, contentWidth - 20, helvetica, 11);
          estimatedHeight += lines.length * lineHeight + 8;
        });

        checkPageBreak(Math.min(estimatedHeight, 200));

        // Sender label
        currentPage.drawText(senderLabel, {
          x: margin,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: senderColor
        });

        yPosition -= 18;

        // Message content
        for (const para of paragraphs) {
          const lines = wrapText(para, contentWidth - 20, helvetica, 11);
          
          for (const line of lines) {
            checkPageBreak(lineHeight);
            currentPage.drawText(line, {
              x: margin + 10,
              y: yPosition,
              size: 11,
              font: helvetica,
              color: textColor
            });
            yPosition -= lineHeight;
          }
          yPosition -= 4; // Paragraph spacing
        }

        // Timestamp for AI messages
        if (!isUser && message.timestamp) {
          const timeStr = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          });
          currentPage.drawText(timeStr, {
            x: margin + 10,
            y: yPosition,
            size: 9,
            font: helvetica,
            color: mutedColor
          });
          yPosition -= 12;
        }

        yPosition -= 15; // Message spacing

        // Separator line between messages
        if (yPosition > margin + 50) {
          currentPage.drawLine({
            start: { x: margin + 20, y: yPosition + 5 },
            end: { x: pageWidth - margin - 20, y: yPosition + 5 },
            thickness: 0.5,
            color: rgb(0.9, 0.9, 0.9)
          });
        }

        yPosition -= 10;
      }

      // === FOOTER ===
      checkPageBreak(80);
      yPosition -= 20;

      currentPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });

      yPosition -= 20;

      currentPage.drawText('About Daryle AI', {
        x: margin,
        y: yPosition,
        size: 11,
        font: helveticaBold,
        color: textColor
      });

      yPosition -= 15;

      const aboutText = 'Daryle AI is an advanced executive coaching platform that provides personalized guidance, strategic insights, and professional development support through artificial intelligence.';
      const aboutLines = wrapText(aboutText, contentWidth, helvetica, 9);
      
      for (const line of aboutLines) {
        currentPage.drawText(line, {
          x: margin,
          y: yPosition,
          size: 9,
          font: helvetica,
          color: mutedColor
        });
        yPosition -= 12;
      }

      yPosition -= 10;

      const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      currentPage.drawText(`Document generated: ${generatedDate}`, {
        x: margin,
        y: yPosition,
        size: 9,
        font: helvetica,
        color: mutedColor
      });

      currentPage.drawText('© Daryle AI Coaching Platform', {
        x: pageWidth - margin - 130,
        y: yPosition,
        size: 9,
        font: helvetica,
        color: mutedColor
      });

      // Add page number to last page
      currentPage.drawText(`Page ${pdfDoc.getPageCount()}`, {
        x: pageWidth / 2 - 20,
        y: 25,
        size: 10,
        font: helvetica,
        color: mutedColor
      });

      // Generate and download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const safeTitle = chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const dateStr = new Date(createdAt).toISOString().split('T')[0];
      const filename = `daryle_ai_chat_${safeTitle}_${dateStr}.pdf`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await logExportAudit('pdf', chatId);

      return { success: true, filename };

    } catch (error) {
      console.error('❌ PDF export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  const exportToMarkdown = useCallback(async ({
    messages,
    chatTitle,
    mode,
    createdAt,
    chatId,
    userName,
    userEmail
  }: ExportChatParams) => {
    const permission = await checkExportPermission();
    if (!permission.allowed) return { success: false, error: permission.message };
    try {
      console.log('🔄 Starting Markdown export...');

      // Generate markdown content
      let markdown = '';
      
      // Header
      markdown += `# ${chatTitle}\n\n`;
      markdown += `**Mode:** ${formatMode(mode)}  \n`;
      markdown += `**Date:** ${new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}  \n`;
      markdown += `**Session ID:** ${chatId.substring(0, 8)}  \n`;
      markdown += `**Exported By:** ${userName || 'Guest User'}  \n`;
      markdown += `**Email:** ${userEmail || 'Not provided'}\n\n`;
      markdown += '---\n\n';

      // Messages
      messages.forEach((message, index) => {
        if (message.sender === 'user') {
          markdown += `## You asked:\n\n`;
          markdown += `${message.content}\n\n`;
        } else {
          markdown += `## Daryle AI responded:\n\n`;
          markdown += `${message.content}\n\n`;
          if (message.timestamp) {
            markdown += `*${new Date(message.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}*\n\n`;
          }
        }
        
        if (index < messages.length - 1) {
          markdown += '---\n\n';
        }
      });

      // Footer
      markdown += '\n---\n\n';
      markdown += `*Generated by Daryle AI on ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}*\n`;

      // Create and download file
      const safeTitle = chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const dateStr = new Date(createdAt).toISOString().split('T')[0];
      const filename = `daryle_ai_chat_${safeTitle}_${dateStr}.md`;

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await logExportAudit('markdown', chatId);

      return { success: true, filename };

    } catch (error) {
      console.error('❌ Markdown export failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, []);

  const exportToWord = useCallback(async ({
    messages,
    chatTitle,
    mode,
    createdAt,
    chatId,
    userName,
    userEmail,
  }: ExportChatParams) => {
    const permission = await checkExportPermission();
    if (!permission.allowed) return { success: false, error: permission.message };
    try {
      const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      const children: Paragraph[] = [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [new TextRun({ text: chatTitle, bold: true })],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Mode: ', bold: true }),
            new TextRun(formatMode(mode)),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Date: ', bold: true }),
            new TextRun(formattedDate),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Session ID: ', bold: true }),
            new TextRun(chatId.substring(0, 8)),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Exported By: ', bold: true }),
            new TextRun(userName || 'Guest User'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Email: ', bold: true }),
            new TextRun(userEmail || 'Not provided'),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Session Transcript')],
        }),
      ];

      for (const message of messages) {
        const isUser = message.sender === 'user';
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: isUser ? 'You asked' : 'Daryle AI responded',
                bold: true,
              }),
            ],
          }),
        );

        const cleanContent = message.content
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/#{1,6}\s/g, '');

        const paragraphs = cleanContent.split('\n').filter((p) => p.trim());
        for (const para of paragraphs) {
          children.push(new Paragraph({ children: [new TextRun(para)] }));
        }

        if (!isUser && message.timestamp) {
          const timeStr = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
          children.push(
            new Paragraph({
              children: [new TextRun({ text: timeStr, italics: true, color: '666666' })],
            }),
          );
        }

        children.push(new Paragraph({ text: '' }));
      }

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Generated by Daryle AI on ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`,
              italics: true,
              color: '888888',
            }),
          ],
        }),
      );

      const doc = new DocxDocument({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);

      const safeTitle = chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const dateStr = new Date(createdAt).toISOString().split('T')[0];
      const filename = `daryle_ai_chat_${safeTitle}_${dateStr}.docx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await logExportAudit('word', chatId);
      return { success: true, filename };
    } catch (error) {
      console.error('❌ Word export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  return { exportToPDF, exportToMarkdown, exportToWord };
};
