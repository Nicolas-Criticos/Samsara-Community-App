import { Link } from "react-router-dom";
import { useState } from "react";
import logo1Url from "../../assets/images/logo1.jpg";
import ParticleField from "../../components/portal/ParticleField.jsx";
import { bubbleMemberKey } from "../../lib/memberDisplay.js";
import { createParticleField } from "../../lib/portalLayout.js";
import MemberBubble from "./components/MemberBubble.jsx";
import MemberProfileModal from "./components/MemberProfileModal.jsx";
import { useCircleBootstrap } from "./hooks/useCircleBootstrap.js";
import { useMemberProfile } from "./hooks/useMemberProfile.js";

export default function CirclePage() {
  const [particles] = useState(() => createParticleField(60));
  const { currentUserId, titleText, bubbleLayout } = useCircleBootstrap();
  const profile = useMemberProfile(currentUserId);
  return (
    <div className="relative isolate flex min-h-screen w-screen max-w-[100vw] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(240,235,220,1)_0%,rgba(245,242,234,0.995)_20%,rgba(244,240,230,0.99)_45%,rgba(243,239,228,0.98)_70%,rgba(242,237,226,0.975)_100%)] animate-portal-pulse">
      <div
        className="pointer-events-auto absolute inset-0 z-10"
        id="riteField"
      >
        {bubbleLayout.map(({ member, x, y }, index) => (
          <MemberBubble
            key={bubbleMemberKey(member, index)}
            member={member}
            x={x}
            y={y}
            onSelect={profile.openMemberProfile}
          />
        ))}
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-center bg-no-repeat opacity-0 filter-[blur(0.3px)]"
        style={{
          backgroundImage: `url(${logo1Url})`,
          backgroundSize: "min(70vh, 70vw)",
          animation:
            "sigilFadeIn 6s ease forwards 2s, sigilBreath 14s ease-in-out infinite",
        }}
      />
      <ParticleField particles={particles} />

      <div className="pointer-events-none absolute inset-0 z-2 flex items-center justify-center max-md:hidden">
        <span className="text-[1.4rem] tracking-[0.08em] text-[rgba(43,43,43,0.45)] animate-whisper-pulse">
          Meet the community
        </span>
      </div>

      <main className="relative z-3 mx-auto max-w-[880px] px-8 py-24 text-center pointer-events-none max-md:px-5 max-md:py-14 max-md:portrait:py-12">
        <div className="mb-52 text-[2.2rem] font-light tracking-[0.12em] max-md:mb-6 max-md:text-[1.4rem] max-md:portrait:mb-[1.8rem]">
          {titleText}
        </div>
      </main>

      <MemberProfileModal
        profileMember={profile.profileMember}
        isSelf={profile.isSelf}
        profileForm={profile.profileForm}
        saveProfile={profile.saveProfile}
        savePending={profile.savePending}
        projectItems={profile.projectItems}
        onClose={profile.closeMemberProfile}
        onAvatarChange={profile.onAvatarChange}
        onPdfChange={profile.onPdfChange}
        avatarPending={profile.avatarPending}
        pdfPending={profile.pdfPending}
      />

      <div className="fixed right-7 top-6 z-20 max-md:bottom-4 max-md:left-1/2 max-md:right-auto max-md:top-auto max-md:-translate-x-1/2 max-md:text-center">
        <Link
          className="text-[0.75rem] tracking-[0.18em] text-[rgba(43,43,43,0.55)] no-underline max-md:inline-flex max-md:max-w-[280px] max-md:w-full max-md:justify-center"
          to="/projects/samsara"
        >
          PROJECT FIELD
        </Link>
      </div>
    </div>
  );
}
