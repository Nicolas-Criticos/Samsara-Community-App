import "../../styles/circle.css";
import { Link } from "react-router-dom";
import ParticleField from "../../components/portal/ParticleField.jsx";
import { bubbleMemberKey } from "../../lib/memberDisplay.js";
import MemberBubble from "./components/MemberBubble.jsx";
import MemberProfileModal from "./components/MemberProfileModal.jsx";
import { useCircleBootstrap } from "./hooks/useCircleBootstrap.js";
import { useMemberProfile } from "./hooks/useMemberProfile.js";
import { useState } from "react";
import { createParticleField } from "../../lib/portalLayout.js";

export default function CirclePage() {
  const [particles] = useState(() => createParticleField(60));
  const { currentUserId, titleText, bubbleLayout } = useCircleBootstrap();
  const profile = useMemberProfile(currentUserId);
  return (
    <div className="portal-bg">
      <div className="rite-field" id="riteField">
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
      <div className="background-sigil" />
      <ParticleField particles={particles} />

      <div className="center-whisper">
        <span>Meet the community</span>
      </div>

      <main className="circle-container">
        <div className="circle-title">{titleText}</div>
      </main>

      <MemberProfileModal
        profileMember={profile.profileMember}
        isSelf={profile.isSelf}
        bio={profile.bio}
        setBio={profile.setBio}
        website={profile.website}
        setWebsite={profile.setWebsite}
        projectItems={profile.projectItems}
        onClose={profile.closeMemberProfile}
        onSaveProfile={profile.saveProfile}
        onAvatarChange={profile.onAvatarChange}
        onPdfChange={profile.onPdfChange}
      />

      <div className="circle-toggle">
        <Link to="/projects/samsara">PROJECT FIELD</Link>
      </div>
    </div>
  );
}
