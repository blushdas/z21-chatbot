import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqData, faqCategories, FAQItem } from '@/data/faqData';
import FAQAnswer from '@/components/FAQAnswer';

const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  // Filter FAQs based on search and category
  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      selectedCategory === null || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedFAQs = faqCategories.map((category) => ({
    ...category,
    items: filteredFAQs.filter((faq) => faq.category === category.id),
  }));

  // Generate FAQPage schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": filteredFAQs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // Toggle expand/collapse all
  const handleExpandAll = () => {
    if (expandedItems.length === filteredFAQs.length) {
      setExpandedItems([]);
    } else {
      setExpandedItems(filteredFAQs.map(faq => faq.id));
    }
  };

  const isAllExpanded = expandedItems.length === filteredFAQs.length && filteredFAQs.length > 0;

  return (
    <>
      <SEOHead
        title="Frequently Asked Questions - Daryle AI | Leadership AI Platform"
        description="Find answers to common questions about Daryle AI. Learn about features, capabilities, content sourcing, privacy, security, and how to get the most from the platform."
        keywords="Daryle AI FAQ, AI leadership platform questions, how Daryle AI works, privacy security, beta access, Ambassador Enterprises"
        canonicalUrl="/faq"
        schemaData={faqSchema}
      />
      <div className="min-h-screen bg-background">
        <LandingNav />
      
      {/* Hero Section */}
      <section className="relative pt-44 md:pt-52 pb-20 px-4 overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue/95 to-brand-blue/90 -mt-[5.5rem] md:-mt-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto font-body">
              Find answers to common questions about Daryle AI
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Category Filters and Expand All */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Topics
            </Button>
            {faqCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>

          {/* Expand All Button */}
          {filteredFAQs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandAll}
              className="shrink-0"
            >
              {isAllExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          )}
        </div>

        {/* FAQ Sections */}
        {groupedFAQs
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <div key={group.id} className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <span>{group.icon}</span>
                {group.label}
              </h2>
              
              <Accordion 
                type="multiple" 
                value={expandedItems.filter(id => group.items.some(faq => faq.id === id))}
                onValueChange={(value) => {
                  // Update expanded items while preserving items from other groups
                  const otherGroupIds = expandedItems.filter(id => !group.items.some(faq => faq.id === id));
                  setExpandedItems([...otherGroupIds, ...value]);
                }}
                className="space-y-2"
              >
                {group.items.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:bg-accent/50 transition-colors">
                      <span className="text-left text-base font-normal">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-3 bg-card">
                      <FAQAnswer content={faq.answer} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

        {/* No Results */}
        {filteredFAQs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No questions found matching "{searchQuery}"
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Contact Support */}
        <Card className="mt-12 bg-accent/20">
          <CardContent className="py-8 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-4">
              Can't find the answer you're looking for? Feel free to reach out.
            </p>
            <Button asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

        <LandingFooter />
      </div>
    </>
  );
};

export default FAQPage;
