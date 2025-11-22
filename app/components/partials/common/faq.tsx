'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface FaqItem {
  title: string;
  text: string;
}

export type FaqItems = Array<FaqItem>;

export function Faq() {
  const items: FaqItems = [
    {
      title: 'How is pricing determined for each plan ?',
      text: "Cohab offre des options de tarification flexibles qui vous permettent de choisir la solution parfaite pour vos besoins et votre budget. Comprendre les facteurs qui influencent le prix de chaque plan vous aide à prendre une décision éclairée. Cohab offre des options de tarification flexibles qui vous permettent de choisir la solution parfaite pour vos besoins et votre budget. Comprendre les facteurs qui influencent le prix de chaque plan vous aide à prendre une décision éclairée. Cohab offre des options de tarification flexibles qui vous permettent de choisir la solution parfaite pour vos besoins et votre budget. Comprendre les facteurs qui influencent le prix de chaque plan vous aide à prendre une décision éclairée",
    },
    {
      title: 'What payment methods are accepted for subscriptions ?',
      text: "Cohab offre des options de tarification flexibles qui vous permettent de choisir la solution parfaite pour vos besoins et votre budget. Comprendre les facteurs qui influencent le prix de chaque plan vous aide à prendre une décision éclairée",
    },
    {
      title: 'Are there any hidden fees in the pricing ?',
      text: "Cohab offre des options de tarification flexibles qui vous permettent de choisir la solution parfaite pour vos besoins et votre budget. Comprendre les facteurs qui influencent le prix de chaque plan vous aide à prendre une décision éclairée",
    },
    {
      title: 'Is there a discount for annual subscriptions ?',
      text: "Cohab offre des options de tarification flexibles qui vous permettent de choisir la solution parfaite pour vos besoins et votre budget. Comprendre les facteurs qui influencent le prix de chaque plan vous aide à prendre une décision éclairée",
    },
    {
      title: 'Do you offer refunds on subscription cancellations ?',
      text: "Cohab offre des options de tarification flexibles qui vous permettent de choisir la solution parfaite pour vos besoins et votre budget. Comprendre les facteurs qui influencent le prix de chaque plan vous aide à prendre une décision éclairée",
    },
    {
      title: 'Can I add extra features to my current plan ?',
      text: "Cohab offre des options de tarification flexibles qui vous permettent de choisir la solution parfaite pour vos besoins et votre budget. Comprendre les facteurs qui influencent le prix de chaque plan vous aide à prendre une décision éclairée",
    },
  ];

  const generateItems = () => {
    return (
      <Accordion type="single" collapsible>
        {items.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>{item.text}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQ</CardTitle>
      </CardHeader>
      <CardContent className="py-3">{generateItems()}</CardContent>
    </Card>
  );
}
