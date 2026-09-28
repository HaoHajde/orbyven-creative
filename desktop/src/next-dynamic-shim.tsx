import { lazy, Suspense, type ComponentType } from "react";

type Loader<P> = () => Promise<{ default: ComponentType<P> }>;
type Options = { loading?: ComponentType };

export default function dynamic<P extends object>(loader: Loader<P>, options: Options = {}) {
  const LazyComponent = lazy(loader);
  const Loading = options.loading;
  return function DesktopDynamicComponent(props: P) {
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
