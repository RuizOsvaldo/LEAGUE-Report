import { useEffect } from "react";

export default function Seo(props: { title: string; description?: string }) {
  useEffect(() => {
    document.title = props.title;

    const ensureTag = (name: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = name;
        document.head.appendChild(tag);
      }
      return tag;
    };

    if (props.description) {
      ensureTag("description").content = props.description;
    }
  }, [props.title, props.description]);

  return null;
}
