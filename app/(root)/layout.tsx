import React from 'react';

const RootLayout = ({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) => {
  return (
    <div className='relative flex flex-col'>   
      {/* <UserAccess />              */}
      {children}        
    </div>
  )
}

export default RootLayout