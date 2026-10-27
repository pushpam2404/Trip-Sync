import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../contexts/TripContext';
import { useStartTrip } from '../hooks/useStartTrip';
import { Plate } from '../components/ui/Plate';
import { RouteLine } from '../components/ui/RouteLine';
import { SakhaIcon, PlannerIcon, SavedIcon, HistoryIcon, ArrowRightIcon, NavigateIcon } from '../components/ui/icons';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Up late,';
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function HomeScreen() {
  const { user } = useAuth();
  const { trips, savedRoutes, isLoading } = useTrips();
  const startTrip = useStartTrip();
  const navigate = useNavigate();

  const firstName = user?.name.trim().split(/\s+/)[0] ?? 'there';
  const lastTrip = trips[0];
  const vehicles = [...(user?.fourWheelers ?? []), ...(user?.twoWheelers ?? [])];

  const entries = [
    { to: '/sakha', icon: SakhaIcon, title: 'Ask Sakha', text: 'Chat about a route, or type two places and go.' },
    { to: '/planner', icon: PlannerIcon, title: 'Plan a trip', text: 'Find a stay and places to visit near your destination.' },
    { to: '/saved', icon: SavedIcon, title: 'Saved routes', text: isLoading ? 'Loading your routes' : savedRoutes.length ? plural(savedRoutes.length, 'route') + ' ready to drive' : 'Routes you save in the planner show up here.' },
    { to: '/history', icon: HistoryIcon, title: 'Trip history', text: isLoading ? 'Loading your trips' : trips.length ? plural(trips.length, 'trip') + ' logged' : 'Finished trips are logged here.' },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-8 sm:pt-10">
      <p className="text-lg text-ink-soft">{greeting()}</p>
      <h1 className="t-display mt-1 break-words">{firstName}.</h1>

      <button
        type="button"
        onClick={() => navigate('/sakha?tab=route')}
        className="mt-8 flex min-h-16 w-full items-center justify-between gap-4 rounded-[var(--radius-control)] bg-accent px-5 text-left text-on-accent transition-[filter] hover:brightness-95"
      >
        <span>
          <span className="block font-display text-xl font-bold leading-tight">Where to?</span>
          <span className="block text-sm opacity-80">Start a trip from any two places</span>
        </span>
        <NavigateIcon className="size-6 shrink-0" aria-hidden="true" />
      </button>

      <section className="mt-10" aria-labelledby="home-start">
        <h2 id="home-start" className="t-heading mb-1">Jump in</h2>
        <ul className="rows">
          {entries.map(({ to, icon: Icon, title, text }) => (
            <li key={to}>
              <Link to={to} className="group flex min-h-16 items-center gap-4 py-3.5">
                <Icon className="size-6 shrink-0 text-ink-soft group-hover:text-ink" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold leading-tight">{title}</span>
                  <span className="block text-ink-soft">{text}</span>
                </span>
                <ArrowRightIcon className="size-5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {lastTrip && (
        <section className="mt-10" aria-labelledby="home-last">
          <h2 id="home-last" className="t-heading mb-3">Last trip</h2>
          <div className="rounded-[var(--radius-control)] border border-line bg-surface p-4">
            <RouteLine from={lastTrip.from} to={lastTrip.to} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="t-meta">{lastTrip.date}{lastTrip.duration ? `, about ${lastTrip.duration}` : ''}</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => startTrip(lastTrip.from, lastTrip.to)}>
                Drive it again
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mt-10" aria-labelledby="home-vehicles">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 id="home-vehicles" className="t-heading">Your vehicles</h2>
          <Link to="/account" className="font-semibold text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink">
            {vehicles.length ? 'Manage' : 'Add one'}
          </Link>
        </div>
        {vehicles.length ? (
          <ul className="flex flex-wrap gap-3">
            {vehicles.map((v) => (
              <li key={v.id}>
                <Plate reg={v.regNumber} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-soft">No vehicles yet. Add a registration number and it will be offered when you start a trip.</p>
        )}
      </section>
    </div>
  );
}
