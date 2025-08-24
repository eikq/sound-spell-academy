import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, AlertCircle, RefreshCw } from "lucide-react";

interface MicPermissionModalProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  error?: string | null;
}

export default function MicPermissionModal({ open, onClose, onRetry, error }: MicPermissionModalProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const isPermissionError = error?.includes('denied') || error?.includes('not-allowed');
  const isDeviceError = error?.includes('No microphone found') || error?.includes('audio-capture');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MicOff className="w-5 h-5 text-destructive" />
            Microphone Access Required
          </DialogTitle>
          <DialogDescription>
            Arcane Diction needs microphone access to detect your spell pronunciations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant={isPermissionError ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <h4 className="font-medium">To enable microphone access:</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              {isPermissionError ? (
                <>
                  <li>• Click the microphone icon in your browser's address bar</li>
                  <li>• Select "Allow" for microphone access</li>
                  <li>• Refresh the page if needed</li>
                </>
              ) : isDeviceError ? (
                <>
                  <li>• Check that your microphone is connected</li>
                  <li>• Make sure no other applications are using your microphone</li>
                  <li>• Check your system's audio settings</li>
                </>
              ) : (
                <>
                  <li>• Allow microphone access when prompted</li>
                  <li>• Make sure your microphone is working</li>
                  <li>• Check browser permissions if needed</li>
                </>
              )}
            </ul>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Mic className="w-4 h-4 text-primary" />
              <span className="font-medium">Why we need microphone access:</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              The game analyzes your voice pronunciation to cast spells accurately. 
              No audio is recorded or stored.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRetry} disabled={isRetrying}>
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}