"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { Brain } from "lucide-react";
import { ReactNode } from "react";



const ProviderClerk = ({ children } : { children: ReactNode }) => (  
  
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string} appearance={{
      layout: {
        socialButtonsVariant: 'iconButton',
        logoImageUrl: `${<Brain className="w-8 h-8 text-purple-400" />}`
      },
      variables: {
        colorBackground: '#15171c',
        colorPrimary: '',
        colorText: 'white',
        colorInputBackground: '#1b1f29',
        colorInputText: 'white',
      }
    }}>
        {children}
    </ClerkProvider>  
);

export default ProviderClerk;