"use client";
import { useEffect, useRef } from "react";

export default function NetopiaPaymentForm({
  envKey,
  data,
}: {
  envKey: string;
  data: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  return (
    <form
      ref={formRef}
      method="POST"
      action="https://sandboxsecure.mobilpay.ro"
      style={{ display: "none" }}
    >
      <input type="hidden" name="env_key" value={envKey} />
      <input type="hidden" name="data" value={data} />
    </form>
  );
} 