'use client';

import { QRCodeSVG } from 'qrcode.react';

type AuthenticatorQrProps = {
  otpauthUri: string;
};

const AuthenticatorQr = ({ otpauthUri }: AuthenticatorQrProps) => (
  <div className="inline-flex justify-self-start rounded-2xl border border-border bg-white p-3 shadow-soft">
    <QRCodeSVG
      value={otpauthUri}
      size={168}
      level="M"
      bgColor="#ffffff"
      fgColor="#0c1324"
      title="QR code for your authenticator app"
    />
  </div>
);

export default AuthenticatorQr;
