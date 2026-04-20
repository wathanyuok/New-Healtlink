"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Typography,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  Stack,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  AddCircleOutline as AddIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useAuthStore } from "@/stores/authStore";

/* ── Card header SVG icons matching the Nuxt originals ── */
const ReferOutSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
    <g fill="white">
      <path d="M4.5 2A2.5 2.5 0 0 0 2 4.5v7A2.5 2.5 0 0 0 4.5 14h5a.5.5 0 0 0 0-1h-5A1.5 1.5 0 0 1 3 11.5v-7A1.5 1.5 0 0 1 4.5 3h5a.5.5 0 0 0 0-1z" />
      <path d="m13.854 7.646l-3-3a.5.5 0 0 0-.707.707l2.146 2.146H5.5a.5.5 0 0 0 0 1h6.793l-2.146 2.146a.5.5 0 0 0 .707.707l3-3a.5.5 0 0 0 0-.706" />
    </g>
  </svg>
);
const ReferInSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
    <path fill="white" fillRule="evenodd" d="m11.02 3.77l.01-.01l.99.99V2.5l-.5-.5h-9l-.51.5v.493L2 3v10.29l.36.46l5 1.72L8 15v-1h3.52l.5-.5v-2.25l-1 1V13H8V4.71l-.33-.46L4.036 3h6.984zM7 14.28l-4-1.34V3.72l4 1.34zm3.09-6.75h4.97v1h-4.93l1.59 1.6l-.71.7l-2.47-2.46v-.71l2.49-2.48l.7.7z" clipRule="evenodd" />
  </svg>
);
const ReferBackSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512">
    <path fill="white" d="m464 440l-28.12-32.11c-22.48-25.65-43.33-45.45-72.08-58.7c-26.61-12.26-60-18.65-104.27-19.84V432L48 252L259.53 72v103.21c72.88 3 127.18 27.08 161.56 71.75C449.56 284 464 335.19 464 399.26Z" />
  </svg>
);
const ReferReceiveSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512">
    <path fill="white" d="M48 399.26C48 335.19 62.44 284 90.91 247c34.38-44.67 88.68-68.77 161.56-71.75V72L464 252L252.47 432V329.35c-44.25 1.19-77.66 7.58-104.27 19.84c-28.75 13.25-49.6 33.05-72.08 58.7L48 440Z" />
  </svg>
);
const RequestOutSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
    <path fill="white" d="m28.6 30l1.4-1.4l-7.6-7.6H29v-2H19v10h2v-6.6zM2 28.6L3.4 30l7.6-7.6V29h2V19H3v2h6.6zM17 2h-2v10.2l-4.6-4.6L9 9l7 7l7-7l-1.4-1.4l-4.6 4.6z" />
  </svg>
);
const RequestBackSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
    <path fill="white" d="m19 20.4l1.4-1.4l7.6 7.6V20h2v10H20v-2h6.6zm-6 0L11.6 19L4 26.6V20H2v10h10v-2H5.4zm4-4.4h-2V5.8l-4.6 4.6L9 9l7-7l7 7l-1.4 1.4L17 5.8z" />
  </svg>
);

/* ── Topic SVG icons matching Nuxt originals ── */
const OpdSvgIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48">
    <g fill="#036245">
      <path d="M21.935 10.723a4.001 4.001 0 1 1-7.86-1.494c1.525.926 2.854 1.448 4.239 1.638c1.176.16 2.34.074 3.62-.144m-6.988-3.306a4.002 4.002 0 0 1 6.845 1.301c-1.262.225-2.251.298-3.206.167c-1.08-.148-2.192-.568-3.64-1.468M14.5 15c-2.736 0-4.902 1.67-6.291 3.69C6.81 20.727 6 23.368 6 25.973c0 1.391.645 3.005 1.1 4.02A25 25 0 0 0 8 31.79V40a2 2 0 1 0 4 0V28.544c.292-2.408.978-4.59 1.763-6.374l.657 2.557a2 2 0 0 0 1.937 1.502H21.5a2 2 0 1 0 0-4h-3.592l-1.47-5.727A2 2 0 0 0 14.5 15M37 18a4 4 0 1 0 0-8a4 4 0 0 0 0 8" />
      <path fillRule="evenodd" d="M31.222 18.045a2 2 0 0 1 2.245 1.135l2.648 5.887H40a2 2 0 1 1 0 4h-5.179a2 2 0 0 1-1.824-1.18L31.563 24.7c-.457.842-.758 1.617-.949 2.422c-.2.844-.288 1.765-.272 2.887c.323.135.681.27 1.064.402c.884.304 1.793.558 2.536.757l.37.099h.001l.587.158a9 9 0 0 1 .377.111l.009.003c.061.02.328.103.575.254c.322.195.546.463.592.517l.006.007c.093.11.186.23.27.345c.173.231.377.526.591.845c.434.644.963 1.467 1.471 2.268a275 275 0 0 1 1.817 2.907l.168.272L39.07 40l1.705-1.047a2 2 0 0 1-3.41 2.093l-.162-.265a300 300 0 0 0-1.79-2.865A103 103 0 0 0 34 35.739q-.201-.3-.35-.51l-.334-.089l-.411-.11a43 43 0 0 1-2.803-.838L30 34.156V42h-2v-7H17v7h-2V32h11.033a4 4 0 0 1-.257-.284c-.397-.482-.776-1.176-.776-2.05c0-4.702 1.268-7.621 2.813-9.396a7.6 7.6 0 0 1 2.173-1.748c.313-.165.587-.277.799-.35a4 4 0 0 1 .406-.12l.016-.004l.008-.002h.003s.004-.001.425 1.954zm2.867 17.31l-.034-.011zm-.663-.43l-.01-.012z" clipRule="evenodd" />
      <path d="M23.5 12c.828 0 1.5-1.12 1.5-2.5S24.328 7 23.5 7S22 8.12 22 9.5s.672 2.5 1.5 2.5" />
    </g>
  </svg>
);
const ErSvgIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
    <path fill="#036245" d="M11 0v3h2V0zM7.88 1.46L6.46 2.87L8.59 5L10 3.58zm8.24 0L14 3.58L15.41 5l2.13-2.12zM12 5a2 2 0 0 0-2 2v1H6.5c-.66 0-1.22.42-1.42 1L3 15v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8l-2.08-6c-.2-.58-.76-1-1.42-1H14V7a2 2 0 0 0-2-2M6.5 9.5h11L19 14H5zm0 6.5A1.5 1.5 0 0 1 8 17.5A1.5 1.5 0 0 1 6.5 19A1.5 1.5 0 0 1 5 17.5A1.5 1.5 0 0 1 6.5 16m11 0a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5" />
  </svg>
);
const IpdSvgIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 64 64">
    <path fill="#036245" d="M10.643 35.727a4.233 4.233 0 0 1 4.24-4.235a4.236 4.236 0 0 1 4.242 4.235a4.241 4.241 0 0 1-8.482 0m40.954-2.594c1.865 0 3.371 1.462 3.387 3.313l.007 8.944H20.958V33.142zm-34.558 12.25c1.151 0 2.086-.935 2.086-2.086s-.935-2.086-2.086-2.086h-6.03a2.083 2.083 0 0 0-2.084 2.086c0 1.151.928 2.086 2.084 2.086z"/>
    <path fill="#036245" d="M57.009 54.179v9.327h5.523V33.928a2.756 2.756 0 0 0-2.755-2.759a2.764 2.764 0 0 0-2.768 2.759v13.575H7.42V28.348c0-1.523-1.328-2.762-2.855-2.762v.002c-1.522 0-2.721 1.237-2.721 2.759v35.158h5.575v-9.327h49.59zM39.508.14c1.767 0 4.661.743 6.271 2.505l-2.17 4.168a5.17 5.17 0 0 0-4.101-2.014c-1.649 0-3.116.77-4.065 1.973L33.23 2.737C35.093.873 37.669.139 39.508.139zm-.625 4.2h1.238V3.101h1.239V1.865h-1.239V.627h-1.238v1.238h-1.237v1.236h1.237z"/>
    <path fill="#036245" d="M43.482 10.248a3.982 3.982 0 1 1-7.965 0a3.982 3.982 0 0 1 7.965 0m-7.812 5.117c-2.784.015-4.397 2.274-4.76 3.55l-3.392 11.133h3.433l2.5-8.542h1.779l-2.493 8.54h13.507l-2.475-8.54h1.778l2.566 8.542h3.382L48.09 18.915c-.362-1.26-1.941-3.476-4.664-3.544zm-25.377 2.56c-4.888 0-8.86-3.974-8.86-8.862c0-4.889 3.971-8.864 8.86-8.864c4.886 0 8.864 3.976 8.864 8.864s-3.979 8.862-8.864 8.862m-.003-2.194c3.678 0 6.672-2.991 6.672-6.67c0-3.675-2.993-6.671-6.672-6.671c-3.676 0-6.665 2.995-6.665 6.671c0 3.68 2.989 6.67 6.665 6.67"/>
    <path fill="#036245" d="M10.338 10.233a.66.66 0 0 1-.639-.048a.66.66 0 0 1-.296-.46l-.009-5.151a.667.667 0 0 1 1.333 0V8.57l3.416-1.609a.666.666 0 0 1 .566 1.204z"/>
  </svg>
);
const InOutpatientSvgIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 64 64">
    <path fill="#036245" d="M29.905 11.078a5.225 5.225 0 0 0 5.616-4.789A5.23 5.23 0 0 0 30.725.673a5.22 5.22 0 0 0-5.614 4.792a5.22 5.22 0 0 0 4.794 5.614zm1.431 10.461a3.516 3.516 0 0 1 2.852 3.464a3.53 3.53 0 0 1-3.528 3.528H19.228a2.24 2.24 0 0 1-2.074-3.088l1.236-2.885l13.766-9.86h-6.559c-2.519-.07-4.289.805-5.304 2.789c-.688 1.335-4.342 9.498-4.342 9.498a3.528 3.528 0 0 0 3.278 4.836h4.465l-1.317 8.66l-6.93 20.026a3.37 3.37 0 1 0 6.402 2.113l7.969-22.59c1.554 2.525 4.647 7.051 5.173 7.906c.121 1.421 1.234 13.948 1.234 13.948a3.374 3.374 0 0 0 3.657 3.059a3.37 3.37 0 0 0 3.059-3.657l-1.31-14.743a3.3 3.3 0 0 0-.49-1.471l-5.729-9.285l.912-11.653s1.357 4.611 1.458 4.944c.291.952.947 1.635 1.62 2.18c.394.314 7.081 4.865 7.081 4.865c.372.172.676.323 1.075.35a2.35 2.35 0 0 0 2.533-2.158a2.37 2.37 0 0 0-.92-2.061s-6.663-4.575-6.934-4.774a1.4 1.4 0 0 1-.439-.61l-2.637-9.498c-.429-1.437-1.877-2.673-3.708-2.673h-.789z"/>
    <path fill="#036245" d="M30.66 27.241a2.232 2.232 0 0 0 .24-4.453l-1.635 4.467z"/>
  </svg>
);
const InpatientRoundedSvgIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
    <path fill="#036245" d="M4 22q-.825 0-1.412-.587T2 20V4q0-.825.588-1.412T4 2h9q.825 0 1.413.588T15 4v16q0 .825-.587 1.413T13 22zm0-11.475q.45-.275.95-.4T6 10h5q.55 0 1.05.125t.95.4V4H4zM8.5 9q-.825 0-1.412-.588T6.5 7t.588-1.412T8.5 5t1.413.588T10.5 7t-.587 1.413T8.5 9m-1 8v1q0 .425.288.713T8.5 19t.713-.288T9.5 18v-1h1q.425 0 .713-.288T11.5 16t-.288-.712T10.5 15h-1v-1q0-.425-.288-.712T8.5 13t-.712.288T7.5 14v1h-1q-.425 0-.712.288T5.5 16t.288.713T6.5 17zm12.4-2.2q-.3.3-.712.3t-.713-.3L16.4 12.7q-.3-.3-.3-.7t.3-.7l2.075-2.1q.3-.3.713-.3t.712.3t.3.713t-.3.712l-.4.375h2.175q.425 0 .713.288t.287.712t-.288.713t-.712.287H19.5l.4.375q.3.3.3.713t-.3.712"/>
  </svg>
);

const TopicIcon = ({ kind }: { kind: string }) => {
  switch (kind) {
    case "opd": return <OpdSvgIcon />;
    case "er": return <ErSvgIcon />;
    case "ipd": return <IpdSvgIcon />;
    case "in-outpatient": return <InOutpatientSvgIcon />;
    case "inpatient-rounded": return <InpatientRoundedSvgIcon />;
    default: return <OpdSvgIcon />;
  }
};

/* ── Tooltip content per card ── */
const TOOLTIP_CONTENT: Record<string, string> = {
  "แจ้งเตือน - การส่งตัวผู้ป่วยออก (Refer Out)":
    "จะแสดงจำนวนรายการใบส่งตัวแยกตามประเภท OPD, IPD, ER ที่ปลายทางได้อัพเดทข้อมูลมาเป็นสถานะ:\n• ยืนยันการส่งตัว\n• เปลี่ยนแปลงนัดหมาย\n• ยกเลิก (กรณี Request Refer)\n• ปฏิเสธ\n• รับเข้ารักษา\nตัวเลขการแจ้งเตือนจะหายไปเมื่อกดเข้าดูข้อมูล",
  "แจ้งเตือน - การรับตัวผู้ป่วยเข้า (Refer In)":
    "จะแสดงจำนวนรายการใบส่งตัวแยกตามประเภท OPD, IPD, ER ที่มีสถานะ:\n• รอตอบรับ\nตัวเลขการแจ้งเตือนจะหายไปเมื่อกดเข้าดูข้อมูล",
  "แจ้งเตือน - การส่งตัวผู้ป่วยกลับ (Refer Back)":
    "จะแสดงจำนวนรายการใบส่งตัวแยกตามประเภท OPD, IPD, ER ที่ปลายทางได้อัพเดทข้อมูลมาเป็นสถานะ:\n• ยืนยันการส่งตัว\n• เปลี่ยนแปลงนัดหมาย\n• ยกเลิก\n• ปฏิเสธ\n• รับเข้ารักษา\nตัวเลขการแจ้งเตือนจะหายไปเมื่อกดเข้าดูข้อมูล",
  "แจ้งเตือน - การรับผู้ป่วยกลับ":
    "จะแสดงจำนวนรายการใบส่งตัวแยกตามประเภท OPD, IPD, ER ที่มีสถานะ:\n• รอตอบรับ\nตัวเลขการแจ้งเตือนจะหายไปเมื่อกดเข้าดูข้อมูล",
  "แจ้งเตือน - การร้องขอส่งตัวมา":
    "จะแสดงจำนวนรายการร้องขอส่งตัวที่มีสถานะ:\n• ปฏิเสธ\nตัวเลขการแจ้งเตือนจะหายไปเมื่อกดเข้าดูข้อมูล",
  "แจ้งเตือน - คำร้องขอส่งตัวไป":
    "จะแสดงจำนวนคำร้องขอส่งตัวที่มีสถานะ:\n• รอตอบรับ\nตัวเลขการแจ้งเตือนจะหายไปเมื่อกดเข้าดูข้อมูล",
};

interface AlertCardDef {
  title: string;
  icon: React.ReactNode;
  topics: {
    name: string;
    description: string;
    kind: string;
    monitorKeys: string[];
    path: string;
  }[];
}

const ALERT_CARDS: AlertCardDef[] = [
  {
    title: "แจ้งเตือน - การส่งตัวผู้ป่วยออก (Refer Out)",
    icon: <ReferOutSvg />,
    topics: [
      { name: "ผู้ป่วย OPD", description: "OPD", kind: "opd", monitorKeys: ["REFER_OUT_OPD"], path: "/refer-out/all?kind=opd" },
      { name: "ผู้ป่วย ER", description: "Emergency", kind: "er", monitorKeys: ["REFER_OUT_EMERGENCY"], path: "/refer-out/all?kind=er" },
      { name: "ผู้ป่วย IPD", description: "IPD", kind: "ipd", monitorKeys: ["REFER_OUT_IPD"], path: "/refer-out/all?kind=ipd" },
    ],
  },
  {
    title: "แจ้งเตือน - การรับตัวผู้ป่วยเข้า (Refer In)",
    icon: <ReferInSvg />,
    topics: [
      { name: "ผู้ป่วย OPD", description: "OPD", kind: "opd", monitorKeys: ["REFER_IN_OPD"], path: "/refer-in/all?kind=opd" },
      { name: "ผู้ป่วย ER", description: "Emergency", kind: "er", monitorKeys: ["REFER_IN_EMERGENCY"], path: "/refer-in/all?kind=er" },
      { name: "ผู้ป่วย IPD", description: "IPD", kind: "ipd", monitorKeys: ["REFER_IN_IPD"], path: "/refer-in/all?kind=ipd" },
    ],
  },
  {
    title: "แจ้งเตือน - การส่งตัวผู้ป่วยกลับ (Refer Back)",
    icon: <ReferBackSvg />,
    topics: [
      { name: "ผู้ป่วย OPD", description: "OPD", kind: "opd", monitorKeys: ["REFER_BACK_OPD"], path: "/refer-back/all?kind=opd" },
      { name: "ผู้ป่วย ER", description: "Emergency", kind: "er", monitorKeys: ["REFER_BACK_EMERGENCY"], path: "/refer-back/all?kind=er" },
      { name: "ผู้ป่วย IPD", description: "IPD", kind: "ipd", monitorKeys: ["REFER_BACK_IPD"], path: "/refer-back/all?kind=ipd" },
    ],
  },
  {
    title: "แจ้งเตือน - การรับผู้ป่วยกลับ",
    icon: <ReferReceiveSvg />,
    topics: [
      { name: "ผู้ป่วย OPD", description: "OPD", kind: "opd", monitorKeys: ["REFER_BACK_IN_OPD"], path: "/refer-receive/all?kind=opd" },
      { name: "ผู้ป่วย ER", description: "Emergency", kind: "er", monitorKeys: ["REFER_BACK_IN_EMERGENCY"], path: "/refer-receive/all?kind=er" },
      { name: "ผู้ป่วย IPD", description: "IPD", kind: "ipd", monitorKeys: ["REFER_BACK_IN_IPD"], path: "/refer-receive/all?kind=ipd" },
    ],
  },
  {
    title: "แจ้งเตือน - การร้องขอส่งตัวมา",
    icon: <RequestOutSvg />,
    topics: [
      { name: "ร้องขอส่งตัวมา", description: "Request Refer In", kind: "in-outpatient", monitorKeys: ["REQUEST_REFER_IN"], path: "/request-refer-out/all" },
      { name: "ร้องขอส่งตัวคืน", description: "Request Refer Back In", kind: "inpatient-rounded", monitorKeys: ["REQUEST_REFER_BACK_IN"], path: "/request-refer-out/all" },
    ],
  },
  {
    title: "แจ้งเตือน - คำร้องขอส่งตัวไป",
    icon: <RequestBackSvg />,
    topics: [
      { name: "คำร้องขอส่งตัวไป", description: "Request Refer Back", kind: "in-outpatient", monitorKeys: ["REQUEST_REFER_OUT"], path: "/request-refer-back/all" },
      { name: "คำร้องขอส่งตัวกลับ", description: "Request Refer Back Out", kind: "inpatient-rounded", monitorKeys: ["REQUEST_REFER_BACK"], path: "/request-refer-back/all" },
    ],
  },
];

export default function FollowDeliveryPage() {
  const router = useRouter();
  const { getReferMonitor } = useDashboardStore();
  const profile = useAuthStore((s) => s.profile);
  const optionHospital = useAuthStore((s) => s.optionHospital);
  const [monitorData, setMonitorData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchMonitorData = useCallback(async () => {
    try {
      setLoading(true);
      // Match Nuxt logic: send hospital param from auth profile
      const idHospital = (profile?.permissionGroup as any)?.hospital?.id;
      const excludedIds = optionHospital ?? idHospital;
      const param: { hospital: number | null } = {
        hospital: typeof excludedIds === "number" ? excludedIds : null,
      };
      const res = await getReferMonitor(param);
      // apiGet returns response.data, Nuxt uses res.data (i.e. response.data.data)
      const data = res?.data || res || {};
      setMonitorData(data);
    } catch (err) {
      console.error("Failed to fetch refer monitor:", err);
      setMonitorData({});
    } finally {
      setLoading(false);
    }
  }, [getReferMonitor, profile, optionHospital]);

  // Fetch on mount and re-fetch when optionHospital changes (matching Nuxt watch)
  useEffect(() => {
    fetchMonitorData();
  }, [fetchMonitorData]);

  const getCount = (keys: string[]) =>
    keys.reduce((sum, key) => sum + (monitorData[key] || 0), 0);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              border: "2px solid #bbb",
              borderRadius: "4px",
              width: 44,
              height: 44,
              color: "#333",
              "&:hover": { borderColor: "#999", bgcolor: "#f5f5f5" },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} color="#00AF75">
            ติดตามการส่งตัว
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/create")}
          sx={{
            bgcolor: "#00AF75",
            borderRadius: "6px",
            px: 2,
            py: 1,
            fontSize: "1rem",
            textTransform: "none",
            "&:hover": { bgcolor: "#009966" },
          }}
        >
          สร้างใบส่งตัว
        </Button>
      </Stack>

      {/* Alert Cards Grid */}
      <Grid container spacing={3}>
        {ALERT_CARDS.map((card) => (
          <Grid item xs={12} md={6} key={card.title}>
            <Card
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              {/* Card Header — matches Nuxt green bar */}
              <Box
                sx={{
                  bgcolor: "#036245",
                  color: "white",
                  px: 2,
                  py: 1.2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  {card.icon}
                  <Typography sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                </Stack>
                <Tooltip
                  title={
                    <Box sx={{ whiteSpace: "pre-line", p: 1, fontSize: "0.85rem" }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        {card.title}
                      </Typography>
                      {TOOLTIP_CONTENT[card.title] || ""}
                    </Box>
                  }
                  arrow
                  placement="bottom-end"
                  slotProps={{
                    tooltip: {
                      sx: {
                        bgcolor: "#036245",
                        color: "white",
                        maxWidth: 400,
                        fontSize: "0.8rem",
                        "& .MuiTooltip-arrow": { color: "#036245" },
                      },
                    },
                  }}
                >
                  {/* Filled green circle "?" icon — matches Nuxt */}
                  <IconButton size="small" sx={{ color: "white", p: 0 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.25)",
                        border: "2px solid white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    >
                      ?
                    </Box>
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Card Body - Topic Items — matches Nuxt card-refer.vue */}
              <Box sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                <Grid container spacing={1.5}>
                  {card.topics.map((topic) => {
                    const count = getCount(topic.monitorKeys);
                    const hasAlert = count > 0;
                    const isWide = card.topics.length <= 2;
                    return (
                      <Grid item xs={isWide ? 6 : 6} sm={isWide ? 6 : 4} key={topic.name}>
                        <Card
                          onClick={() => {
                            // Nuxt: prevent navigation when count = 0
                            if (hasAlert) router.push(topic.path);
                          }}
                          sx={{
                            p: 1.5,
                            cursor: hasAlert ? "pointer" : "default",
                            // Nuxt: bg-white when hasAlert, bg-gray-50 when 0
                            bgcolor: hasAlert ? "#fff" : "#f0f0f0",
                            borderRadius: "16px",
                            boxShadow: "0px 10px 8px rgba(0, 0, 0, 0.04), 0px 4px 3px rgba(0, 0, 0, 0.1)",
                            transition: "all 0.2s",
                            "&:hover": hasAlert
                              ? { bgcolor: "#dcfce7" }
                              : {},
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            minHeight: 80,
                          }}
                        >
                          <Box sx={{ flexShrink: 0, color: "#036245" }}>
                            <TopicIcon kind={topic.kind} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                fontWeight: 700,
                                color: hasAlert ? "#000" : "#9ca3af",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {topic.name}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                color: hasAlert ? "#6b7280" : "#9ca3af",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {topic.description}
                            </Typography>
                          </Box>
                          {loading ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                // Nuxt: bg-[#EF4444] when hasAlert, bg-gray-80 when 0
                                bgcolor: hasAlert ? "#EF4444" : "#9ca3af",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                flexShrink: 0,
                              }}
                            >
                              {count}
                            </Box>
                          )}
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
