import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSendContactMessage } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const sendMessage = useSendContactMessage();
  const [location] = useLocation();
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  // Prefill subject if query param exists (e.g. from Artwork detail)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const inquiry = searchParams.get("inquiry");
    if (inquiry) {
      form.setValue("subject", inquiry);
    }
  }, [location, form]);

  const onSubmit = (data: ContactFormValues) => {
    sendMessage.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Message Sent",
            description: "Thank you for your inquiry. I will get back to you soon.",
          });
          form.reset();
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to send message. Please try again later.",
          });
        }
      }
    );
  };

  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen bg-secondary/20">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-16 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="font-serif text-4xl md:text-5xl mb-6">Contact & Inquiries</h1>
          <p className="text-muted-foreground font-light">
            For inquiries about available works, commissions, or just to say hello.
          </p>
        </header>

        <div className="bg-background p-8 md:p-12 shadow-sm border border-border/50 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" className="border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-foreground px-0 bg-transparent" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Your email address" type="email" className="border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-foreground px-0 bg-transparent" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="What is this regarding?" className="border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-foreground px-0 bg-transparent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest text-muted-foreground">Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Your message..." 
                        className="min-h-[150px] resize-none border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-foreground px-0 bg-transparent" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full md:w-auto px-12 py-6 rounded-none text-sm uppercase tracking-widest font-medium"
                disabled={sendMessage.isPending}
              >
                {sendMessage.isPending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </Form>
        </div>

      </div>
    </main>
  );
}
