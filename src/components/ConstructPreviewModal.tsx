import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ArrowRight, X, Calendar, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

interface Construct {
  id: string;
  slug: string;
  title: string;
  description?: string;
  oe_keys: string[];
  tags: string[];
  state: 'draft' | 'published' | 'archived';
  latest_version: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ConstructPreviewModalProps {
  construct: Construct | null;
  isOpen: boolean;
  onClose: () => void;
  getConstructImage: (slug: string) => string;
}

const ConstructPreviewModal: React.FC<ConstructPreviewModalProps> = ({
  construct,
  isOpen,
  onClose,
  getConstructImage,
}) => {
  const navigate = useNavigate();

  if (!construct) return null;

  const handleViewDetails = () => {
    navigate(`/constructs/${construct.slug}`);
    onClose();
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'archived':
        return 'bg-[var(--ui-bg-hover)] text-[var(--chat-text)]';
      default:
        return 'bg-[var(--ui-bg-hover)] text-[var(--chat-text)]';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-brand-blue mb-2">
                {construct.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getStateColor(construct.state)}>
                  {construct.state.charAt(0).toUpperCase() + construct.state.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Version {construct.latest_version}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Construct Image */}
          <AspectRatio ratio={16 / 10} className="bg-muted rounded-lg overflow-hidden">
            <img
              src={getConstructImage(construct.slug)}
              alt={construct.title}
              className="w-full h-full object-contain"
            />
          </AspectRatio>

          {/* Description */}
          {construct.description && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
              <p className="text-sm leading-relaxed">{construct.description}</p>
            </div>
          )}

          <Separator />

          {/* Tags */}
          {construct.tags && construct.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium text-sm text-muted-foreground">Tags</h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {construct.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* OE Keys */}
          {construct.oe_keys && construct.oe_keys.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">OE Keys</h4>
              <div className="flex flex-wrap gap-1">
                {construct.oe_keys.map((key) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Updated {formatDistanceToNow(new Date(construct.updated_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Created {formatDistanceToNow(new Date(construct.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleViewDetails} className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white">
              <Eye className="w-4 h-4 mr-2" />
              More Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConstructPreviewModal;