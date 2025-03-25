import { useState, useEffect } from "react";
import { ZenoraButton } from "@/components/ui/button-zenora";
import { Mail, Phone, MapPin, Send, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface ContactProps {
  selectedPlan?: string | null;
}

const Contact = ({ selectedPlan }: ContactProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const location = useLocation();
  
  // Set the subject based on the selected plan
  useEffect(() => {
    if (selectedPlan) {
      let planName = "";
      switch (selectedPlan) {
        case "client":
          planName = "Client Plan";
          break;
        case "referral":
          planName = "Referral Discount Plan";
          break;
        case "transfer":
          planName = "Transfer Discount Plan";
          break;
        case "enterprise":
          planName = "Enterprise Plan";
          break;
        case "demo":
          planName = "Demo Request";
          break;
        default:
          planName = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
      }
      
      setFormData(prev => ({
        ...prev,
        subject: `Inquiry about ${planName}`
      }));
      
      // Only show toast if not coming from demo redirect
      const searchParams = new URLSearchParams(location.search);
      const fromCalendly = searchParams.get("fromCalendly");
      
      if (!fromCalendly) {
        toast({
          title: selectedPlan === "demo" ? "Demo Requested" : "Plan Selected",
          description: selectedPlan === "demo" 
            ? "You've requested a demo. Please complete the form to schedule." 
            : `You've selected the ${planName}. Please complete the form to proceed.`,
          variant: "default",
        });
      }
    }
  }, [selectedPlan, location.search]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log("Submitting contact form", formData);
      
      // Save to Supabase
      const { error: supabaseError } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message
          }
        ]);
      
      if (supabaseError) {
        console.error("Supabase error:", supabaseError);
        throw new Error("Failed to save message to database");
      }
      
      // Send email via edge function
      const isDemoRequest = selectedPlan === "demo" || formData.subject.toLowerCase().includes("demo");
      
      const emailResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            isDemoRequest
          }),
        }
      );

      const responseData = await emailResponse.json();
      
      if (!emailResponse.ok) {
        console.error("Email API error response:", responseData);
        throw new Error(responseData.error || responseData.message || "Failed to send email");
      }
      
      console.log("Email sent successfully:", responseData);
      
      // Show success message
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
      
      // Reset success message after some time
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Show a more detailed error message
      let errorMessage = "There was a problem sending your message. ";
      if (error.message.includes("database")) {
        errorMessage += "We couldn't save your message. ";
      } else if (error.message.includes("Gmail") || error.message.includes("email")) {
        errorMessage += "We couldn't send the email notification. ";
      }
      errorMessage += "Please try again or contact us directly at zenoramgmt@gmail.com";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.2
          }
        }
      }}
      className="zenora-section bg-white dark:bg-zenora-dark relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-zenora-gradient opacity-5 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-zenora-light opacity-5 blur-3xl rounded-full"></div>
      
      <div className="zenora-container relative z-10">
        <motion.div 
          variants={fadeIn}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center rounded-full border border-zenora-purple/30 bg-zenora-purple/5 px-3 py-1 text-sm text-zenora-purple backdrop-blur-sm mb-6">
            <span className="font-medium">Get In Touch</span>
          </div>
          
          <h2 className="zenora-heading bg-clip-text text-transparent bg-zenora-gradient">
            {selectedPlan ? "Complete Your Reservation" : "Contact Our Team"}
          </h2>
          
          <p className="zenora-subheading">
            {selectedPlan 
              ? "We're excited to help you get started with your selected plan. Please fill out the form below to complete your reservation."
              : "Have questions about our services or ready to get started? Our team is here to help you transform your property management experience."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div 
            variants={fadeIn}
            className="group"
          >
            <div className="bg-zenora-gradient rounded-2xl p-8 text-white h-full relative overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-zenora-dark to-zenora-purple mix-blend-overlay opacity-70"></div>
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white opacity-10 rounded-full"></div>
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-white opacity-10 rounded-full"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                <p className="mb-8 text-white/80">
                  Fill out the form or contact us directly using the information below.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4 hover:translate-x-1 transition-transform">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <a href="tel:+15107704237" className="text-white/80 hover:text-white transition-colors">
                        (510) 770-4237
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 hover:translate-x-1 transition-transform">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <a href="mailto:zenoramgmt@gmail.com" className="text-white/80 hover:text-white transition-colors">
                        zenoramgmt@gmail.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 hover:translate-x-1 transition-transform">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Office</p>
                      <p className="text-white/80">
                        1121 Tewa Ct.<br />
                        Fremont, CA 94539
                      </p>
                    </div>
                  </div>
                </div>
                
                {selectedPlan && selectedPlan !== "demo" && (
                  <div className="mt-8 p-4 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm">
                    <h4 className="font-medium mb-2">Selected Plan Information</h4>
                    <div>
                      {selectedPlan === "client" && (
                        <div>
                          <p className="font-semibold">Client Plan</p>
                          <p className="text-white/80">$1,999/year - Base plan for single property owners</p>
                        </div>
                      )}
                      {selectedPlan === "referral" && (
                        <div>
                          <p className="font-semibold">Referral Discount Plan</p>
                          <p className="text-white/80">$1,499/year - $500 discount for referred clients</p>
                        </div>
                      )}
                      {selectedPlan === "transfer" && (
                        <div>
                          <p className="font-semibold">Transfer Discount Plan</p>
                          <p className="text-white/80">$1,499/year - $500 discount for clients switching from another management company</p>
                        </div>
                      )}
                      {selectedPlan === "enterprise" && (
                        <div>
                          <p className="font-semibold">Enterprise Plan</p>
                          <p className="text-white/80">Custom pricing for portfolio investors with 10+ properties</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-8 p-4 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm transform transition-transform duration-300 hover:scale-105">
                  <h4 className="font-medium mb-2">Schedule a Demo</h4>
                  <p className="text-white/80 mb-4">
                    See our AI-powered property management platform in action with a personalized demo.
                  </p>
                  <a href="https://calendly.com/zenoramgmt/30min" target="_blank" rel="noopener noreferrer">
                    <ZenoraButton 
                      variant="default" 
                      size="lg" 
                      className="w-full group bg-zenora-gradient hover:opacity-90"
                    >
                      <Calendar className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" /> Book a Demo
                    </ZenoraButton>
                  </a>
                </div>
                
                <div className="mt-12">
                  <h4 className="font-medium mb-4">Connect With Us</h4>
                  <div className="flex gap-4">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all hover:scale-110 transform" aria-label="Facebook">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Contact Form */}
          <motion.div 
            variants={fadeIn}
            className="group"
          >
            <div className="zenora-card h-full p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-2xl font-bold mb-6">
                {selectedPlan ? "Complete Your Reservation" : "Send Us a Message"}
              </h3>
              
              {isSubmitted ? (
                <div className="h-full flex flex-col items-center justify-center py-8">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 260, 
                      damping: 20 
                    }}
                    className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-green-600"
                  >
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <motion.h4 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-semibold mb-2"
                  >
                    Message Sent!
                  </motion.h4>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-center max-w-md"
                  >
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </motion.p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="group">
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="zenora-input w-full transition-all border-gray-300 focus:border-zenora-purple focus:ring focus:ring-zenora-purple/20 group-hover:border-zenora-purple/50"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="group">
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="zenora-input w-full transition-all border-gray-300 focus:border-zenora-purple focus:ring focus:ring-zenora-purple/20 group-hover:border-zenora-purple/50"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="group">
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="zenora-input w-full transition-all border-gray-300 focus:border-zenora-purple focus:ring focus:ring-zenora-purple/20 group-hover:border-zenora-purple/50"
                    >
                      <option value="">Select a topic</option>
                      <option value="Pricing Information">Pricing Information</option>
                      <option value="Feature Inquiry">Feature Inquiry</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Request a Demo">Request a Demo</option>
                      <option value="Inquiry about Client Plan">Inquiry about Client Plan</option>
                      <option value="Inquiry about Referral Discount Plan">Inquiry about Referral Discount Plan</option>
                      <option value="Inquiry about Transfer Discount Plan">Inquiry about Transfer Discount Plan</option>
                      <option value="Inquiry about Enterprise Plan">Inquiry about Enterprise Plan</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="group">
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="zenora-input min-h-[120px] transition-all border-gray-300 focus:border-zenora-purple focus:ring focus:ring-zenora-purple/20 group-hover:border-zenora-purple/50"
                      placeholder={selectedPlan ? "Please tell us more about your property management needs..." : "How can we help you?"}
                    ></textarea>
                  </div>
                  
                  <ZenoraButton 
                    type="submit" 
                    size="lg" 
                    className="w-full sm:w-auto group"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /> 
                        {selectedPlan ? "Complete Reservation" : "Send Message"}
                      </>
                    )}
                  </ZenoraButton>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default Contact;
