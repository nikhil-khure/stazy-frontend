// Responsive utility helpers
export const isMobile = () => window.innerWidth <= 768;
export const isTablet = () => window.innerWidth > 768 && window.innerWidth <= 1024;
export const isDesktop = () => window.innerWidth > 1024;

// Responsive padding helper
export const getResponsivePadding = (mobile, desktop) => {
  return isMobile() ? mobile : desktop;
};

// Responsive font size helper
export const getResponsiveFontSize = (mobile, desktop) => {
  return isMobile() ? mobile : desktop;
};

// Responsive grid columns
export const getResponsiveGridColumns = (mobileColumns, desktopMinWidth) => {
  return isMobile() ? mobileColumns : `repeat(auto-fill, minmax(${desktopMinWidth}px, 1fr))`;
};
