import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SendTemplateEmailParams {
  templateName: string;
  recipientEmail: string;
  data?: Record<string, any>;
}

export function useTemplateEmail() {
  const sendEmail = useCallback(async ({ templateName, recipientEmail, data }: SendTemplateEmailParams) => {
    try {
      const { data: result, error } = await supabase.functions.invoke("send-template-email", {
        body: { templateName, recipientEmail, data: data || {} },
      });
      if (error) {
        console.error(`Template email error (${templateName}):`, error);
        return false;
      }
      if (result?.error && !result?.skipped) {
        console.error(`Template email error (${templateName}):`, result.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`Template email error (${templateName}):`, err);
      return false;
    }
  }, []);

  return { sendEmail };
}
