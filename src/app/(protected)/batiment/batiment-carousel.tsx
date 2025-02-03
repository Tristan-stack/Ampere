"use client";
import { CardStack } from "@/components/card-stack";
import { cn } from "@/lib/utils";
export function BatimentCarousel() {
  return (
    <div className="h-full flex items-center justify-center w-full px-0 lg:px-8 p-8 mt-2 3xl:p-16">
      <CardStack items={CARDS} />
    </div>
  );
}

// Small utility to highlight the content of specific section of a testimonial content
export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-700/[0.2] dark:text-emerald-500 px-1 py-0.5",
        className
      )}
    >
      {children}
    </span>
  );
};

const CARDS = [
  {
    id: 0,
    name: "Gestion de l'éclairage",
    designation: "Conseil d'économie",
    content: (
      <p>
        Installez des <Highlight>détecteurs de présence</Highlight> dans les zones communes et
        remplacez les ampoules traditionnelles par des <Highlight>LED</Highlight>. Cela peut
        réduire la consommation d'éclairage jusqu'à 80%.
      </p>
    ),
  },
  {
    id: 1,
    name: "Isolation thermique",
    designation: "Amélioration énergétique",
    content: (
      <p>
        Une bonne <Highlight>isolation des murs</Highlight> et des <Highlight>fenêtres double vitrage</Highlight> peuvent
        réduire les pertes de chaleur de 25 à 30%. Pensez à vérifier l'étanchéité des portes et fenêtres.
      </p>
    ),
  },
  {
    id: 2,
    name: "Systèmes intelligents",
    designation: "Innovation énergétique",
    content: (
      <p>
        L'installation d'un <Highlight>système de gestion intelligente</Highlight> du bâtiment permet
        d'optimiser automatiquement le chauffage et la climatisation selon <Highlight>l'occupation réelle</Highlight>.
      </p>
    ),
  },
];
