import { PropsWithChildren, useEffect } from 'react';
import { Toaster } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from './store';
import { toggleRTL, toggleTheme, toggleLocale, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from './store/themeConfigSlice';
import store from './store';
import { applyAccentColor } from './utils/themeUtils';

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleLocale(localStorage.getItem('i18nextLng') || themeConfig.locale));
        dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
    }, [dispatch, themeConfig.theme, themeConfig.menu, themeConfig.layout, themeConfig.rtlClass, themeConfig.animation, themeConfig.navbar, themeConfig.locale, themeConfig.semidark]);

    useEffect(() => {
        applyAccentColor(themeConfig.accentColor, themeConfig.customPrimaryColor);
    }, [themeConfig.accentColor, themeConfig.customPrimaryColor, themeConfig.theme]);

    return (
        <div
            className={`${(store.getState().themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${themeConfig.rtlClass
                } main-section antialiased relative text-sm font-normal`}
            style={{ fontFamily: themeConfig.fontFamily }}
        >
            {children}
            <Toaster 
  richColors 
  position="top-center" 
theme={themeConfig.theme as 'light' | 'dark' | 'system'} 
  toastOptions={{
    // This applies the class directly to the toast card
    className: 'font-google_sans', 
    // Or more specifically for nested elements
    classNames: {
      toast: 'font-google_sans',
      title: 'font-google_sans',
      description: 'font-google_sans',
    }
  }} 
/>
        </div>
    );
}

export default App;
