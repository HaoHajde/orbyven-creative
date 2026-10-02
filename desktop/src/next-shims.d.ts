declare module "next/image" {
  import type { ComponentType, ImgHTMLAttributes } from "react";

  type StaticImageLike = string | { src: string; width?: number; height?: number };
  type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
    src: StaticImageLike;
    width?: number;
    height?: number;
    priority?: boolean;
  };

  const Image: ComponentType<ImageProps>;
  export default Image;
}

declare module "next/link" {
  import type { AnchorHTMLAttributes, ComponentType, ReactNode } from "react";

  type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children?: ReactNode;
  };

  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module "next/dynamic" {
  import type { ComponentType } from "react";

  type DynamicModule<Props> = { default: ComponentType<Props> };
  type DynamicLoader<Props> = () => Promise<DynamicModule<Props>>;
  type DynamicOptions = { loading?: ComponentType };

  export default function dynamic<Props extends object>(
    loader: DynamicLoader<Props>,
    options?: DynamicOptions,
  ): ComponentType<Props>;
}
