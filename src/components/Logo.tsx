type LogoProps = {
  size?: 'header' | 'hero' | 'modal' | 'banner';
  withWordmark?: boolean;
};

export function Logo({size = 'header', withWordmark = false}: LogoProps) {
  return (
    <span className={`logo logo-${size}`}>
      <img src="/assets/teti-logo-default.png" alt="Teti logo" />
      {withWordmark ? <span>teti.bot</span> : null}
    </span>
  );
}
