import { useState, type FormEvent } from "react";
import { LogOut, RefreshCw, Search } from "lucide-react";
import logo from "../assets/images/Gemini_Generated_Image_9ggd829ggd829ggd.png";

interface HeaderProps {
  error: string;
  loading: boolean;
  username?: string;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
}

export const Header = ({ error, loading, username, onNavigate, onRefresh, onLogout }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) onNavigate(`/alerts?query=${encodeURIComponent(query)}`);
  };

  return <header className="soc-topbar">
    <button onClick={() => onNavigate("/dashboard")} className="soc-brand" aria-label="DEJEN overview">
      <img src={logo} alt="" className="soc-brand-mark" />
      <span className="soc-brand-name">DEJEN</span>
      <span className="soc-brand-divider" />
      <span className="soc-brand-caption">Security Operations</span>
    </button>

    <form className="soc-search-bar" onSubmit={submitSearch}>
      <Search size={15} />
      <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search alerts, hosts, or IPs" aria-label="Search workspace" />
      <kbd>/</kbd>
    </form>

    <div className="soc-toolbar">
      <span className={`soc-connection ${error ? "is-down" : ""}`}><span />{error ? "API offline" : "API connected"}</span>
      <button onClick={onRefresh} disabled={loading} className="soc-header-cta" title="Refresh backend data"><RefreshCw size={15} className={loading ? "soc-spinning" : ""} /><span>{loading ? "Refreshing" : "Refresh data"}</span></button>
      <button onClick={onLogout} className="soc-icon-button" title={`Sign out ${username || ""}`} aria-label="Sign out"><LogOut size={15} /></button>
    </div>
  </header>;
};