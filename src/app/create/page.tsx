"use client";
import React from "react";
import { Box, Typography, IconButton, Stack } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ── Icons from Nuxt originals ── */

// car-emergency (ER)
const CarEmergencyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
    <path fill="#036245" d="M11 0v3h2V0zM7.88 1.46L6.46 2.87L8.59 5L10 3.58zm8.24 0L14 3.58L15.41 5l2.13-2.12zM12 5a2 2 0 0 0-2 2v1H6.5c-.66 0-1.22.42-1.42 1L3 15v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8l-2.08-6c-.2-.58-.76-1-1.42-1H14V7a2 2 0 0 0-2-2M6.5 9.5h11L19 14H5zm0 6.5A1.5 1.5 0 0 1 8 17.5A1.5 1.5 0 0 1 6.5 19A1.5 1.5 0 0 1 5 17.5A1.5 1.5 0 0 1 6.5 16m11 0a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5" />
  </svg>
);

// inpatient (IPD)
const InpatientIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64">
    <path fill="#036245" d="M10.643 35.727a4.233 4.233 0 0 1 4.24-4.235a4.236 4.236 0 0 1 4.242 4.235a4.241 4.241 0 0 1-8.482 0m40.954-2.594c1.865 0 3.371 1.462 3.387 3.313l.007 8.944H20.958V33.142zm-34.558 12.25c1.151 0 2.086-.935 2.086-2.086s-.935-2.086-2.086-2.086h-6.03a2.083 2.083 0 0 0-2.084 2.086c0 1.151.928 2.086 2.084 2.086z"/>
    <path fill="#036245" d="M57.009 54.179v9.327h5.523V33.928a2.756 2.756 0 0 0-2.755-2.759a2.764 2.764 0 0 0-2.768 2.759v13.575H7.42V28.348c0-1.523-1.328-2.762-2.855-2.762v.002c-1.522 0-2.721 1.237-2.721 2.759v35.158h5.575v-9.327h49.59zM39.508.14c1.767 0 4.661.743 6.271 2.505l-2.17 4.168a5.17 5.17 0 0 0-4.101-2.014c-1.649 0-3.116.77-4.065 1.973L33.23 2.737C35.093.873 37.669.139 39.508.139zm-.625 4.2h1.238V3.101h1.239V1.865h-1.239V.627h-1.238v1.238h-1.237v1.236h1.237z"/>
    <path fill="#036245" d="M43.482 10.248a3.982 3.982 0 1 1-7.965 0a3.982 3.982 0 0 1 7.965 0m-7.812 5.117c-2.784.015-4.397 2.274-4.76 3.55l-3.392 11.133h3.433l2.5-8.542h1.779l-2.493 8.54h13.507l-2.475-8.54h1.778l2.566 8.542h3.382L48.09 18.915c-.362-1.26-1.941-3.476-4.664-3.544zm-25.377 2.56c-4.888 0-8.86-3.974-8.86-8.862c0-4.889 3.971-8.864 8.86-8.864c4.886 0 8.864 3.976 8.864 8.864s-3.979 8.862-8.864 8.862m-.003-2.194c3.678 0 6.672-2.991 6.672-6.67c0-3.675-2.993-6.671-6.672-6.671c-3.676 0-6.665 2.995-6.665 6.671c0 3.68 2.989 6.67 6.665 6.67"/>
    <path fill="#036245" d="M10.338 10.233a.66.66 0 0 1-.639-.048a.66.66 0 0 1-.296-.46l-.009-5.151a.667.667 0 0 1 1.333 0V8.57l3.416-1.609a.666.666 0 0 1 .566 1.204z"/>
  </svg>
);

// outpatient (OPD)
const OutpatientIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <g fill="#036245">
      <path d="M21.935 10.723a4.001 4.001 0 1 1-7.86-1.494c1.525.926 2.854 1.448 4.239 1.638c1.176.16 2.34.074 3.62-.144m-6.988-3.306a4.002 4.002 0 0 1 6.845 1.301c-1.262.225-2.251.298-3.206.167c-1.08-.148-2.192-.568-3.64-1.468M14.5 15c-2.736 0-4.902 1.67-6.291 3.69C6.81 20.727 6 23.368 6 25.973c0 1.391.645 3.005 1.1 4.02A25 25 0 0 0 8 31.79V40a2 2 0 1 0 4 0V28.544c.292-2.408.978-4.59 1.763-6.374l.657 2.557a2 2 0 0 0 1.937 1.502H21.5a2 2 0 1 0 0-4h-3.592l-1.47-5.727A2 2 0 0 0 14.5 15M37 18a4 4 0 1 0 0-8a4 4 0 0 0 0 8" />
      <path fillRule="evenodd" d="M31.222 18.045a2 2 0 0 1 2.245 1.135l2.648 5.887H40a2 2 0 1 1 0 4h-5.179a2 2 0 0 1-1.824-1.18L31.563 24.7c-.457.842-.758 1.617-.949 2.422c-.2.844-.288 1.765-.272 2.887c.323.135.681.27 1.064.402c.884.304 1.793.558 2.536.757l.37.099h.001l.587.158a9 9 0 0 1 .377.111l.009.003c.061.02.328.103.575.254c.322.195.546.463.592.517l.006.007c.093.11.186.23.27.345c.173.231.377.526.591.845c.434.644.963 1.467 1.471 2.268a275 275 0 0 1 1.817 2.907l.168.272L39.07 40l1.705-1.047a2 2 0 0 1-3.41 2.093l-.162-.265a300 300 0 0 0-1.79-2.865A103 103 0 0 0 34 35.739q-.201-.3-.35-.51l-.334-.089l-.411-.11a43 43 0 0 1-2.803-.838L30 34.156V42h-2v-7H17v7h-2V32h11.033a4 4 0 0 1-.257-.284c-.397-.482-.776-1.176-.776-2.05c0-4.702 1.268-7.621 2.813-9.396a7.6 7.6 0 0 1 2.173-1.748c.313-.165.587-.277.799-.35a4 4 0 0 1 .406-.12l.016-.004l.008-.002h.003s.004-.001.425 1.954zm2.867 17.31l-.034-.011zm-.663-.43l-.01-.012z" clipRule="evenodd" />
      <path d="M23.5 12c.828 0 1.5-1.12 1.5-2.5S24.328 7 23.5 7S22 8.12 22 9.5s.672 2.5 1.5 2.5" />
    </g>
  </svg>
);

// hospital-filled (Refer Back)
const HospitalFilledIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
    <path fill="#036245" d="M20 2H4v2h1v4H2v14h6.5v-7h7v7H22V8h-3V4h1zm-7 5h2v2h-2v2h-2V9H9V7h2V5h2z" />
    <path fill="#036245" d="M10.5 22v-5h3v5z" />
  </svg>
);

// in-outpatient (Request Refer Out - walking person)
const InOutpatientIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64">
    <path fill="#036245" d="M29.905 11.078a5.225 5.225 0 0 0 5.616-4.789A5.23 5.23 0 0 0 30.725.673a5.22 5.22 0 0 0-5.614 4.792a5.22 5.22 0 0 0 4.794 5.614zm1.431 10.461a3.516 3.516 0 0 1 2.852 3.464a3.53 3.53 0 0 1-3.528 3.528H19.228a2.24 2.24 0 0 1-2.074-3.088l1.236-2.885l13.766-9.86h-6.559c-2.519-.07-4.289.805-5.304 2.789c-.688 1.335-4.342 9.498-4.342 9.498a3.528 3.528 0 0 0 3.278 4.836h4.465l-1.317 8.66l-6.93 20.026a3.37 3.37 0 1 0 6.402 2.113l7.969-22.59c1.554 2.525 4.647 7.051 5.173 7.906c.121 1.421 1.234 13.948 1.234 13.948a3.374 3.374 0 0 0 3.657 3.059a3.37 3.37 0 0 0 3.059-3.657l-1.31-14.743a3.3 3.3 0 0 0-.49-1.471l-5.729-9.285l.912-11.653s1.357 4.611 1.458 4.944c.291.952.947 1.635 1.62 2.18c.394.314 7.081 4.865 7.081 4.865c.372.172.676.323 1.075.35a2.35 2.35 0 0 0 2.533-2.158a2.37 2.37 0 0 0-.92-2.061s-6.663-4.575-6.934-4.774a1.4 1.4 0 0 1-.439-.61l-2.637-9.498c-.429-1.437-1.877-2.673-3.708-2.673h-.789z"/>
    <path fill="#036245" d="M30.66 27.241a2.232 2.232 0 0 0 .24-4.453l-1.635 4.467z"/>
  </svg>
);

// inpatient-rounded (Request Refer Back - bed with arrow)
const InpatientRoundedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
    <path fill="#036245" d="M4 22q-.825 0-1.412-.587T2 20V4q0-.825.588-1.412T4 2h9q.825 0 1.413.588T15 4v16q0 .825-.587 1.413T13 22zm0-11.475q.45-.275.95-.4T6 10h5q.55 0 1.05.125t.95.4V4H4zM8.5 9q-.825 0-1.412-.588T6.5 7t.588-1.412T8.5 5t1.413.588T10.5 7t-.587 1.413T8.5 9m-1 8v1q0 .425.288.713T8.5 19t.713-.288T9.5 18v-1h1q.425 0 .713-.288T11.5 16t-.288-.712T10.5 15h-1v-1q0-.425-.288-.712T8.5 13t-.712.288T7.5 14v1h-1q-.425 0-.712.288T5.5 16t.288.713T6.5 17zm12.4-2.2q-.3.3-.712.3t-.713-.3L16.4 12.7q-.3-.3-.3-.7t.3-.7l2.075-2.1q.3-.3.713-.3t.712.3t.3.713t-.3.712l-.4.375h2.175q.425 0 .713.288t.287.712t-.288.713t-.712.287H19.5l.4.375q.3.3.3.713t-.3.712"/>
  </svg>
);

/* ── Data ── */
interface TopicItem {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  kind: string;
}

const REFERRAL_TOPICS: TopicItem[] = [
  { id: 1, name: "ส่งตัวฉุกเฉิน ER", description: "Emergency", icon: <CarEmergencyIcon />, path: "/create/er", kind: "referER" },
  { id: 2, name: "ส่งตัวผู้ป่วย IPD", description: "IPD", icon: <InpatientIcon />, path: "/create/ipd", kind: "referIPD" },
  { id: 3, name: "ส่งตัวผู้ป่วย OPD", description: "OPD", icon: <OutpatientIcon />, path: "/create/opd", kind: "referOut" },
  { id: 4, name: "ส่งตัวผู้ป่วยกลับ", description: "Refer Back", icon: <HospitalFilledIcon />, path: "/create/opd", kind: "referBack" },
];

const REQUEST_TOPICS: TopicItem[] = [
  { id: 1, name: "ร้องขอส่งตัวมา", description: "Request Refer Out", icon: <InOutpatientIcon />, path: "/create/request", kind: "requestReferOut" },
  { id: 2, name: "ร้องขอส่งตัวคืน", description: "Request Refer Back", icon: <InpatientRoundedIcon />, path: "/create/request", kind: "requestReferBack" },
];

/* ── Card Component ── */
function TopicCard({ item }: { item: TopicItem }) {
  return (
    <Link
      href={{ pathname: item.path, query: { kind: item.kind } }}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: "white",
          borderRadius: "16px",
          px: 2,
          py: 3,
          boxShadow: "0px 10px 8px rgba(0,0,0,0.04), 0px 4px 3px rgba(0,0,0,0.1)",
          cursor: "pointer",
          transition: "background-color 0.2s",
          "&:hover": { bgcolor: "#bbf7d0" },
        }}
      >
        <Box sx={{ mr: 2, flexShrink: 0, display: "flex", alignItems: "center" }}>
          {item.icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "black", lineHeight: 1.3 }}>
            {item.name}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#6b7280" }}>
            {item.description}
          </Typography>
        </Box>
      </Box>
    </Link>
  );
}

/* ── Page ── */
export default function CreateReferralPage() {
  const router = useRouter();

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
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
          สร้างใบส่งตัว
        </Typography>
      </Stack>

      {/* Section: สร้างใบส่งตัว */}
      <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", mb: 2 }}>
        สร้างใบส่งตัว
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "1fr 1fr 1fr 1fr" },
          gap: 2,
          mb: 4,
        }}
      >
        {REFERRAL_TOPICS.map((item) => (
          <TopicCard key={item.id} item={item} />
        ))}
      </Box>

      {/* Section: ร้องขอ */}
      <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", mb: 2 }}>
        ร้องขอ
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "1fr 1fr 1fr 1fr" },
          gap: 2,
        }}
      >
        {REQUEST_TOPICS.map((item) => (
          <TopicCard key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  );
}
