import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import type { GameTemplate } from '../../gameTemplates';

interface GameRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: GameTemplate;
}

export default function GameRulesDialog({ open, onOpenChange, template }: GameRulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span className="text-3xl">{template.icon}</span>
            {template.name} Rules
          </DialogTitle>
          <DialogDescription>Game rules and win conditions</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">How to Play</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{template.rulesSummary}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Win Condition</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{template.gameEndCondition}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
