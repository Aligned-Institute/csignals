import { Button } from "@/components/ui/button";
import { Persona } from "@/lib/sageFlows";
import { Briefcase, Building2, Sparkles } from "lucide-react";

interface Props {
    onSelect: (p: Persona) => void;
}

export function PersonaSelector({ onSelect }: Props) {
    return (
        <div className="flex flex-col items-center justify-center p-8 h-full">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-foreground">
                        How would you like to proceed?
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Select your perspective to begin the evaluation.
                    </p>
                </div>

                <div className="grid gap-4">
                    <Button
                        variant="outline"
                        className="h-auto py-4 px-6 justify-start bg-sidebar hover:bg-sidebar-accent hover:border-[#bd00ff]/50 transition-all group"
                        onClick={() => onSelect("investor")}
                    >
                        <Briefcase className="size-8 min-w-[2rem] mr-4 text-[#bd00ff] group-hover:scale-110 transition-transform" />
                        <div className="text-left w-full whitespace-normal">
                            <div className="font-medium text-lg text-foreground">Asset Evaluator</div>
                            <div className="text-xs text-muted-foreground font-normal leading-relaxed">Evaluate chemical asset M&A options, feedstock cost curves, and economic cyclical volatility.</div>
                        </div>
                    </Button>
 
                     <Button
                         variant="outline"
                         className="h-auto py-4 px-6 justify-start bg-sidebar hover:bg-sidebar-accent hover:border-[#00f3ff]/50 transition-all group"
                         onClick={() => onSelect("enterprise")}
                     >
                         <Building2 className="size-8 min-w-[2rem] mr-4 text-[#00f3ff] group-hover:scale-110 transition-transform" />
                         <div className="text-left w-full whitespace-normal">
                             <div className="font-medium text-lg text-foreground">Due Diligence</div>
                             <div className="text-xs text-muted-foreground font-normal leading-relaxed">Evaluate raw material procurement contracts, supply logistics security, index formula pricing, and REACH compliance.</div>
                         </div>
                     </Button>

                    <Button
                        variant="outline"
                        className="h-auto py-4 px-6 justify-start bg-sidebar hover:bg-sidebar-accent hover:border-[#00f3ff]/50 transition-all group border-dashed"
                        onClick={() => onSelect("interactive")}
                    >
                        <Sparkles className="size-8 min-w-[2rem] mr-4 text-[#00f3ff] group-hover:scale-110 transition-transform animate-pulse" />
                        <div className="text-left w-full whitespace-normal">
                            <div className="font-medium text-lg text-foreground bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] bg-clip-text text-transparent">Interactive Sage Chat</div>
                            <div className="text-xs text-muted-foreground font-normal leading-relaxed">Directly query competitor RAG documents, commodity prices, macro indicators, and feedstock analysis.</div>
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
}

