import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        backgroundImage: "url('/Oops!.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="flex flex-col items-center justify-center h-screen"
    >
      {children}
    </div>
  );
};

export default AuthLayout;
