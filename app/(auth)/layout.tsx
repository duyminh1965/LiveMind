import Image from "next/image";

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (      
        <main className="relative h-screen w-full flex justify-items-center">
          <div className="absolute w-full flex-1 justify-items-center ">
            <Image src="/images/bg-img.png" alt="background" width={1024} height={700} />
          </div>
          {children}            
      </main>      
    );
  }
  