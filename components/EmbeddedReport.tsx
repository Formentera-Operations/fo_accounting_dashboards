"use client";

import { useEffect, useRef, useState } from "react";
import { getEmbedToken, type EmbedConfig } from "@/lib/powerbi/embed";

type Props = {
  reportId: string;
  className?: string;
};

export function EmbeddedReport({ reportId, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmbedToken(reportId)
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, [reportId]);

  useEffect(() => {
    if (!config || !containerRef.current) return;

    // Dynamically import powerbi-client to avoid SSR issues
    import("powerbi-client").then(({ service, factories }) => {
      const powerbi = new service.Service(
        factories.hpmFactory,
        factories.wpmpFactory,
        factories.routerFactory
      );
      powerbi.embed(containerRef.current!, {
        type: config.type,
        id: config.id,
        embedUrl: config.embedUrl,
        accessToken: config.accessToken,
        tokenType: config.tokenType,
        settings: {
          panes: { filters: { visible: false } },
          background: 1, // Transparent
        },
      });
    });
  }, [config]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 text-sm">
        Failed to load report: {error}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading report...
      </div>
    );
  }

  return <div ref={containerRef} className={className ?? "w-full h-full"} />;
}
