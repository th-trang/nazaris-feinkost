"use client";

import React from "react";
import { ReactNode } from "react";

export default function ClientLayout({ children, params }: { children: ReactNode; params: { locale: string } }) {
  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
}