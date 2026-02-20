"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignedIn, SignedOut, useClerk } from '@clerk/nextjs';

const LeftSidebar = () => {  
  const { signOut } = useClerk();
  const router = useRouter();
    
  return (
    <section className='left_sidebar h[calc(100vh-5px)]'>     
      <SignedOut>
        <div className="flex items-center justify-center w-full pb-14 max-lg:px-4 lg:pr-8">
          <button className="text-xl w-full bg-orange-400 font-extrabold">
            <Link href="/sign-in">Sign in</Link>
          </button>
        </div>
       </SignedOut>
       <SignedIn>
        <div className="flex items-center justify-center w-full pb-14 max-lg:px-4 lg:pr-8">
          <button className="text-xl w-full bg-orange-400 font-extrabold" onClick={() => signOut(() => router.push('/'))}>
            Log Out
          </button>
        </div>
       </SignedIn>
    </section>
  )
}

export default LeftSidebar


