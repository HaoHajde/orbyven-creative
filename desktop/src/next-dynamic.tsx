import {
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react";

type DynamicModule<Props> = { default: ComponentType<Props> };
type DynamicLoader<Props> = () => Promise<DynamicModule<Props>>;
type DynamicOptions = {
  loading?: ComponentType;
};

export default function dynamic<Props extends object>(
  loader: DynamicLoader<Props>,
  options: DynamicOptions = {},
) {
  const LazyComponent: LazyExoticComponent<ComponentType<Props>> = lazy(loader);
  const Loading = options.loading;

  function DesktopDynamicComponent(props: Props) {
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }

  return DesktopDynamicComponent;
}
