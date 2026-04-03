"use client";
import ReferListLayout from "@/components/referral/ReferListLayout";

export default function RequestReferBackAll() {
  return (
    <ReferListLayout
      pageName="คำขอส่งตัวกลับ ทั้งหมด"
      referralType="requestReferBack"
    />
  );
}
