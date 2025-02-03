"use client";
import { CardStack } from "@/components/card-stack";
import { cn } from "@/lib/utils";
export function EtageCarousel() {
  return (
    <div className="h-full flex items-center justify-center w-full p-8 mt-2 3xl:p-16">
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
    name: "Bonnes pratiques",
    designation: "Conseils quotidiens",
    content: (
      <p>
        Éteignez les <Highlight>appareils en veille</Highlight> en fin de journée et
        privilégiez la <Highlight>lumière naturelle</Highlight>. Ces petits gestes peuvent
        réduire votre consommation de 10%.
      </p>
    ),
  },
  {
    id: 1,
    name: "Confort thermique",
    designation: "Gestion de la température",
    content: (
      <p>
        Maintenez une température de <Highlight>19°C</Highlight> dans les bureaux et
        <Highlight>16°C</Highlight> dans les zones de circulation. Chaque degré en moins
        c'est 7% d'économie !
      </p>
    ),
  },
  {
    id: 2,
    name: "Équipements de bureau",
    designation: "Optimisation énergétique",
    content: (
      <p>
        Configurez la <Highlight>mise en veille automatique</Highlight> des ordinateurs après
        15 minutes d'inactivité et utilisez des <Highlight>multiprises à interrupteur</Highlight>
        pour faciliter leur extinction.
      </p>
    ),
  },
];
