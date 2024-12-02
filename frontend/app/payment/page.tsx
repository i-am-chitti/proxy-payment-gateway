/* eslint-disable @next/next/no-img-element */
"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios from "axios";
import { Loader } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { cx } from "class-variance-authority";

const QRCodePage = () => {
  const [qrCode, setQRCode] = useState<string>("");
  const [queryParamError, setQueryParamError] = useState<string>("");
  const [isGeneratingQRCode, setIsGeneratingQRCode] = useState<boolean>(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string>("");
  const [isCropped, setIsCropped] = useState<boolean>(false);
  const [qrCodeCTA, setQRCodeCTA] = useState<string>("");

  const searchParams = useSearchParams();
  const apiKey = searchParams.get("api_key");
  const orderId = searchParams.get("order_id");
  const redirectUrl = searchParams.get("redirect_url");
  const amount = searchParams.get("amount");

  const generateQRCode = useCallback(async () => {
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/payment/upi`;
    setIsGeneratingQRCode(true);
    try {
      const response = await axios.post(backendUrl, {
        api_key: apiKey,
        order_id: orderId,
        redirect_url: redirectUrl,
        amount: amount,
      });

      if (response.data?.data) {
        if (response.data.data.qrString) {
          QRCode.toDataURL(response.data.data.qrString, (err, url) => {
            if (url) {
              setQRCode(url);
              setQRCodeCTA(response.data.data.qrString);
            } else {
              setQueryParamError("Error generating QR code");
            }
            setIsGeneratingQRCode(false);
          });
        } else if (response.data.data.imageUrl) {
          const qrCodeLink = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}${response.data.data.imageUrl}`;
          setTimeout(() => {
            setQRCode(qrCodeLink);
            setIsGeneratingQRCode(false);
            setIsCropped(true);
          }, 1500);
        }
      } else {
        throw new Error("Error generating QR code");
      }

      console.log(response.data.data.qrString);
    } catch (err) {
      setIsGeneratingQRCode(false);
      setQueryParamError("Error generating QR code");
    }
  }, [amount, apiKey, orderId, redirectUrl]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const handleVerifyPayment = async () => {
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/payment/check`;

    setIsCheckingPayment(true);

    try {
      const response = await axios.get(backendUrl, {
        params: {
          api_key: apiKey,
          order_id: orderId,
        },
      });
      setIsCheckingPayment(false);
      if (response.data.data.success && redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setPaymentError(
          "Payment verification failed. Please check if you have yet paid."
        );
      }
    } catch (err) {
      setIsCheckingPayment(false);
      setPaymentError("Error verifying payment");
    }
  };

  return (
    <div className="flex justify-center items-center text-center h-[100vh]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>
            <Icons.logo className="mx-auto h-6 w-6" />
            Please scan the QR code
          </CardTitle>
          <CardDescription>All UPI Apps Accepted</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {isGeneratingQRCode ? (
            <div className="flex justify-center">
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              {queryParamError || !qrCode ? (
                <p>{queryParamError}</p>
              ) : (
                <>
                  <img
                    src={qrCode}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className={cx(
                      "object-cover object-center pointer-events-none max-w-none",
                      {
                        "w-[540px] ml-[-120px] h-[416px]": isCropped,
                        "w-full": !isCropped,
                      }
                    )}
                  />
                  <div className="flex flex-row mt-4 justify-center gap-4">
                    {qrCodeCTA && (
                      <a
                        className="lg:hidden bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                        href={qrCodeCTA}
                        rel="noreferrer"
                      >
                        Pay
                      </a>
                    )}
                    <Button
                      onClick={handleVerifyPayment}
                      disabled={isCheckingPayment}
                    >
                      Done{" "}
                      {isCheckingPayment && <Loader className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                  {paymentError && (
                    <p className="text-red-500 mt-2">{paymentError}</p>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Page = () => {
  return (
    <Suspense>
      <QRCodePage />
    </Suspense>
  );
};

export default Page;
