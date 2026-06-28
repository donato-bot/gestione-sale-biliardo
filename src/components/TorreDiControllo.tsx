// components/TorreDiControllo.tsx
"use client";

import TabelloneAttivo from "./TabelloneAttivo";
import RicezioneManuale from "./RicezioneManuale";

export default function TorreDiControllo({ salaId }: { salaId: string }) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      <div className="flex-grow">
        <TabelloneAttivo salaId={salaId} />
      </div>
      <div className="lg:w-96 flex-shrink-0">
        <RicezioneManuale salaId={salaId} />
      </div>
    </div>
  );
}