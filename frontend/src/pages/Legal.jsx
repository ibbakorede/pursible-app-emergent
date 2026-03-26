import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Legal() {
  return (
    <div className="min-h-screen bg-background">
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/profile" className="p-2 rounded-xl bg-card hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">Legal</h1>
      </div>
      <Tabs defaultValue="terms">
        <TabsList className="w-full"><TabsTrigger value="terms" className="flex-1">Terms</TabsTrigger><TabsTrigger value="privacy" className="flex-1">Privacy</TabsTrigger></TabsList>
        <TabsContent value="terms" className="bg-card rounded-2xl p-5 mt-3">
          <h3 className="font-semibold mb-2">Terms of Service</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By using Paysible, you agree to these terms and conditions. Paysible provides cross-border payment services including receiving, converting, and withdrawing funds. 
            All transactions are subject to applicable laws and regulations. Users must complete identity verification before using certain features. 
            Paysible reserves the right to suspend accounts suspected of fraudulent activity. Conversion rates and fees are displayed before each transaction is confirmed.
          </p>
        </TabsContent>
        <TabsContent value="privacy" className="bg-card rounded-2xl p-5 mt-3">
          <h3 className="font-semibold mb-2">Privacy Policy</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We collect personal information to provide our services, comply with regulations, and improve user experience. 
            Your data is encrypted and stored securely. We do not sell personal information to third parties. 
            We may share information with regulatory bodies as required by law. You can request data deletion by contacting support.
          </p>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}