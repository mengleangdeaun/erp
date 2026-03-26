import SystemHealthIndicator from './SystemHealthIndicator';

const Footer = () => {
    return (
        <div className="dark:text-white-dark px-6 py-3 mt-auto flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-border/40">
            <div className="text-center sm:text-left text-xs font-medium text-muted-foreground">
                © {new Date().getFullYear()} Keep Doing, Keep Creating.
            </div>
            <div className="flex items-center gap-4">
                <SystemHealthIndicator />
            </div>
        </div>
    );
};

export default Footer;
