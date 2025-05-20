"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Send, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm, ControllerRenderProps, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/components/LanguageToggle";

export default function ContactPage() {
  const { language, forceRefresh } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  // Traduceri pentru pagina de contact
  const translations = useMemo(() => {
    return {
      getInTouch: language === "ro" ? "Contactează-ne" : "Get in Touch",
      helpText:
        language === "ro"
          ? "Ai o problemă sau o întrebare? Suntem aici să ajutăm! Completează formularul de mai jos și echipa noastră îți va răspunde cât mai curând posibil."
          : "Have an issue or question? We're here to help! Fill out the form below and our team will get back to you as soon as possible.",
      messageSent: language === "ro" ? "Mesaj Trimis!" : "Message Sent!",
      thankYou:
        language === "ro"
          ? "Îți mulțumim pentru mesaj. Îți vom răspunde în curând."
          : "Thank you for reaching out. We'll get back to you shortly.",
      somethingWrong:
        language === "ro" ? "Ceva nu a funcționat!" : "Something went wrong!",
      errorMessage:
        language === "ro"
          ? "A apărut o eroare la trimiterea mesajului. Te rugăm să încerci din nou mai târziu."
          : "There was an error sending your message. Please try again later.",
      contactInfo:
        language === "ro" ? "Informații de Contact" : "Contact Information",
      formText:
        language === "ro"
          ? "Completează formularul și îți vom răspunde în 24 de ore."
          : "Fill out the form and we'll get back to you within 24 hours.",
      name: language === "ro" ? "Nume" : "Name",
      yourName: language === "ro" ? "Numele tău" : "Your name",
      email: language === "ro" ? "Email" : "Email",
      emailPlaceholder:
        language === "ro" ? "adresa.ta@exemplu.com" : "your.email@example.com",
      contactType:
        language === "ro"
          ? "Pentru ce ne contactezi?"
          : "What are you contacting us about?",
      reportIssue:
        language === "ro" ? "Raportează o Problemă" : "Report an Issue",
      generalInquiry:
        language === "ro" ? "Întrebare Generală" : "General Inquiry",
      subject: language === "ro" ? "Subiect" : "Subject",
      subjectPlaceholder:
        language === "ro"
          ? "Despre ce este mesajul tău?"
          : "What's your message about?",
      message: language === "ro" ? "Mesaj" : "Message",
      messagePlaceholder:
        language === "ro"
          ? "Spune-ne cum te putem ajuta..."
          : "Tell us how we can help...",
      sending: language === "ro" ? "Se trimite..." : "Sending...",
      sendMessage: language === "ro" ? "Trimite Mesaj" : "Send Message",
      // Validări
      nameMinLength:
        language === "ro"
          ? "Numele trebuie să aibă cel puțin 2 caractere"
          : "Name must be at least 2 characters",
      validEmail:
        language === "ro"
          ? "Te rugăm să introduci o adresă de email validă"
          : "Please enter a valid email address",
      selectType:
        language === "ro"
          ? "Te rugăm să selectezi un tip de contact"
          : "Please select a contact type",
      subjectMinLength:
        language === "ro"
          ? "Subiectul trebuie să aibă cel puțin 5 caractere"
          : "Subject must be at least 5 characters",
      messageMinLength:
        language === "ro"
          ? "Mesajul trebuie să aibă cel puțin 10 caractere"
          : "Message must be at least 10 characters",
    };
  }, [language, forceRefresh]);

  // Actualizează schema de validare cu traducerile
  const formSchema = useMemo(() => {
    return z.object({
      name: z.string().min(2, { message: translations.nameMinLength }),
      email: z.string().email({ message: translations.validEmail }),
      contactType: z.enum(["issue", "inquiry"], {
        required_error: translations.selectType,
      }),
      subject: z.string().min(5, { message: translations.subjectMinLength }),
      message: z.string().min(10, { message: translations.messageMinLength }),
    });
  }, [translations]);

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      contactType: "inquiry",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setIsSuccess(false);
    setIsError(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setIsSuccess(true);
      form.reset(); // Reset the form on success
    } catch (error) {
      console.error('[Contact Form] Submission failed:', error);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      className="container max-w-4xl mx-auto py-4 sm:py-12 px-2 sm:px-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="text-center mb-4 sm:mb-12">
        <h1 className="text-xl xs:text-2xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2 sm:mb-4">
          {translations.getInTouch}
        </h1>
        <p className="text-xs xs:text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {translations.helpText}
        </p>
      </motion.div>

      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-sm sm:text-base text-green-800 dark:text-green-400">
              {translations.messageSent}
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-green-700 dark:text-green-300">
              {translations.thankYou}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {isError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-sm sm:text-base text-red-800 dark:text-red-400">
              {translations.somethingWrong}
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-red-700 dark:text-red-300">
              {translations.errorMessage}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card className="border-purple-100 dark:border-purple-900/50 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-5 h-full">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 xs:p-4 sm:p-8 text-white lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="h-full flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 sm:mb-6">
                      {translations.contactInfo}
                    </h3>
                    <p className="text-xs xs:text-sm sm:text-base mb-4 sm:mb-8 opacity-90 break-words">
                      {translations.formText}
                    </p>
                  </div>

                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="bg-white/20 p-1 xs:p-1.5 sm:p-2 rounded-full flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs xs:text-sm sm:text-base break-all">support@voceacampusului.com</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="bg-white/20 p-1 xs:p-1.5 sm:p-2 rounded-full flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <span className="text-xs xs:text-sm sm:text-base break-words">University Campus, Building A</span>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-12 pt-3 sm:pt-8 border-t border-white/20">
                    <p className="text-[10px] xs:text-xs sm:text-sm opacity-80">
                      &copy; {new Date().getFullYear()} Vocea Campusului. All rights reserved.
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="p-3 xs:p-4 sm:p-8 lg:col-span-3">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-3 xs:space-y-4 sm:space-y-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues, "name">;
                        }) => (
                          <FormItem>
                            <FormLabel className="text-xs xs:text-sm sm:text-base">{translations.name}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={translations.yourName}
                                className="text-xs xs:text-sm sm:text-base h-8 xs:h-9 sm:h-10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px] xs:text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<FormValues, "email">;
                        }) => (
                          <FormItem>
                            <FormLabel className="text-xs xs:text-sm sm:text-base">{translations.email}</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder={translations.emailPlaceholder}
                                className="text-xs xs:text-sm sm:text-base h-8 xs:h-9 sm:h-10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px] xs:text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="contactType"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues, "contactType">;
                      }) => (
                        <FormItem className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                          <FormLabel className="text-xs xs:text-sm sm:text-base">{translations.contactType}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col sm:flex-row sm:space-x-4 space-y-1.5 sm:space-y-0"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="issue" id="issue" className="h-3 w-3 xs:h-4 xs:w-4" />
                                <Label
                                  htmlFor="issue"
                                  className="cursor-pointer text-xs xs:text-sm sm:text-base"
                                >
                                  {translations.reportIssue}
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="inquiry" id="inquiry" className="h-3 w-3 xs:h-4 xs:w-4" />
                                <Label
                                  htmlFor="inquiry"
                                  className="cursor-pointer text-xs xs:text-sm sm:text-base"
                                >
                                  {translations.generalInquiry}
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage className="text-[10px] xs:text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues, "subject">;
                      }) => (
                        <FormItem>
                          <FormLabel className="text-xs xs:text-sm sm:text-base">{translations.subject}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={translations.subjectPlaceholder}
                              className="text-xs xs:text-sm sm:text-base h-8 xs:h-9 sm:h-10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] xs:text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues, "message">;
                      }) => (
                        <FormItem>
                          <FormLabel className="text-xs xs:text-sm sm:text-base">{translations.message}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={translations.messagePlaceholder}
                              className="min-h-20 xs:min-h-24 sm:min-h-32 text-xs xs:text-sm sm:text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] xs:text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-xs xs:text-sm sm:text-base h-8 xs:h-9 sm:h-10"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-1.5 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            {translations.sending}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Send className="mr-1.5 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />{" "}
                            {translations.sendMessage}
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
