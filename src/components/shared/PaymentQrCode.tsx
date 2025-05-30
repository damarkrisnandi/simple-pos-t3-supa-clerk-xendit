import { QRCode } from "react-qrcode-logo";
import { Skeleton } from "../ui/skeleton";

type PaymentQRCodeProps = {
  qrString: string | undefined;
};

export const PaymentQRCodeSkeleton = () => {
  return (
    <Skeleton className="relative aspect-square w-full max-w-80 p-1"></Skeleton>
  );
};

export const PaymentQRCode = (props: PaymentQRCodeProps) => {
  console.log(props.qrString)
  return (
    <div className="relative aspect-square w-full max-w-80 p-1">
      {props.qrString && <QRCode
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "16px",
        }}
        eyeRadius={8}
        bgColor={"#FFF"}
        value={props.qrString}
        qrStyle="dots"
      />}
    </div>
  );
};
