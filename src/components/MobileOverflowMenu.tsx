
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Star, User, LogOut, MoreHorizontal, Tag, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import FavoritesDrawer from './favorites/FavoritesDrawer';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/SupabaseAuthContext';

interface MobileOverflowMenuProps {
  className?: string;
}

const MobileOverflowMenu: React.FC<MobileOverflowMenuProps> = ({ className }) => {
  const [open, setOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const { favorites } = useFavorites();
  const { user, signOut, profile } = useAuth();

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button aria-label="Open menu" className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${className || ''}`}>
            <MoreHorizontal size={18} />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="px-4 py-3">
          <SheetHeader>
            <SheetTitle className="t-body">Menu</SheetTitle>
          </SheetHeader>
          <div className="py-2 space-y-2">
            <button
              className="w-full flex items-center justify-between px-3 py-2 rounded-md border"
              onClick={() => {
                setFavOpen(true);
                setOpen(false);
              }}
            >
              <span className="flex items-center gap-2">
                <Star size={18} className={favorites.length > 0 ? 'text-brand-gold fill-brand-gold' : ''} />
                Favorites
              </span>
              {favorites.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">{favorites.length}</span>
              )}
            </button>

            {/* Admin links for admin+ users */}
            {(profile?.role === 'admin' || profile?.role === 'superadmin') && (
              <>
                <Link to="/admin" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Settings size={18} /> Admin
                  </Button>
                </Link>
              </>
            )}

            <Link to="/profile" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <User size={18} /> My Profile
              </Button>
            </Link>

            {user && (
              <Button variant="outline" className="w-full justify-start gap-2" onClick={signOut}>
                <LogOut size={18} /> Sign Out
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <FavoritesDrawer 
        isOpen={favOpen} 
        onClose={() => setFavOpen(false)} 
        onResumeChat={(chat) => {
          // Handle chat resumption logic here if needed
        }}
      />
    </>
  );
};

export default MobileOverflowMenu;
