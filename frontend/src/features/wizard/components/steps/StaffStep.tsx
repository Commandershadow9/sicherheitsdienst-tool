import { useState } from 'react';
import { WizardData } from '../../../../types/wizard';
import { User, useUsers } from '../../../users/api';
import { Users, UserCheck, UserCog, Search, X, Plus, Loader2, AlertCircle } from 'lucide-react';

interface StaffStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function StaffStep({ data, onUpdate, onNext, onPrevious }: StaffStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteManager, setSelectedSiteManager] = useState<User | null>(null);
  const [selectedShiftLeaders, setSelectedShiftLeaders] = useState<User[]>([]);
  const [selectedAdditionalStaff, setSelectedAdditionalStaff] = useState<User[]>([]);

  // Load users (active employees only)
  const { data: usersData, isLoading } = useUsers({ isActive: true });

  // Filter users based on search
  const filteredUsers = usersData?.data.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  // Helper: Check if user is already assigned
  const isUserAssigned = (userId: string) => {
    return (
      selectedSiteManager?.id === userId ||
      selectedShiftLeaders.some((u) => u.id === userId) ||
      selectedAdditionalStaff.some((u) => u.id === userId)
    );
  };

  const handleSelectSiteManager = (user: User) => {
    setSelectedSiteManager(user);
  };

  const handleRemoveSiteManager = () => {
    setSelectedSiteManager(null);
  };

  const handleAddShiftLeader = (user: User) => {
    if (!selectedShiftLeaders.some((u) => u.id === user.id)) {
      setSelectedShiftLeaders([...selectedShiftLeaders, user]);
    }
  };

  const handleRemoveShiftLeader = (userId: string) => {
    setSelectedShiftLeaders(selectedShiftLeaders.filter((u) => u.id !== userId));
  };

  const handleAddAdditionalStaff = (user: User) => {
    if (!selectedAdditionalStaff.some((u) => u.id === user.id)) {
      setSelectedAdditionalStaff([...selectedAdditionalStaff, user]);
    }
  };

  const handleRemoveAdditionalStaff = (userId: string) => {
    setSelectedAdditionalStaff(selectedAdditionalStaff.filter((u) => u.id !== userId));
  };

  const handleNext = () => {
    onUpdate({
      staff: {
        siteManagerId: selectedSiteManager?.id,
        shiftLeaderIds: selectedShiftLeaders.map((u) => u.id),
        additionalStaffIds: selectedAdditionalStaff.map((u) => u.id),
      },
    });
    onNext();
  };

  const requiredStaff = data.securityConcept?.requiredStaff || 1;
  const totalAssigned = (selectedSiteManager ? 1 : 0) + selectedShiftLeaders.length + selectedAdditionalStaff.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" />
          Personal & Zuweisungen
        </h2>
        <p className="text-gray-600 text-sm mb-3">
          Weisen Sie Mitarbeiter dem Objekt zu
        </p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">
              Benötigt: <strong>{requiredStaff}</strong> Mitarbeiter
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${totalAssigned >= requiredStaff ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}></div>
            <span className="text-gray-700">
              Zugewiesen: <strong>{totalAssigned}</strong> Mitarbeiter
            </span>
          </div>
        </div>
      </div>

      {/* Selected Site Manager */}
      {selectedSiteManager && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-purple-900 flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Objektleiter
            </div>
            <button
              onClick={handleRemoveSiteManager}
              className="p-2 text-purple-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Entfernen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {selectedSiteManager.firstName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{selectedSiteManager.firstName} {selectedSiteManager.lastName}</div>
              <div className="text-sm text-gray-600">{selectedSiteManager.email}</div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Shift Leaders */}
      {selectedShiftLeaders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            Schichtleiter ({selectedShiftLeaders.length})
          </div>
          <div className="space-y-2">
            {selectedShiftLeaders.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user.firstName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-gray-600">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveShiftLeader(user.id)}
                  className="p-1.5 text-indigo-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Additional Staff */}
      {selectedAdditionalStaff.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Weitere Mitarbeiter ({selectedAdditionalStaff.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedAdditionalStaff.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {user.firstName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAdditionalStaff(user.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Mitarbeiter hinzufügen
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Nach Name, E-Mail oder Rolle suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* User List */}
        {isLoading && (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
            <p className="text-gray-600 text-sm">Lade Mitarbeiter...</p>
          </div>
        )}

        {!isLoading && filteredUsers && filteredUsers.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Keine Mitarbeiter gefunden</p>
          </div>
        )}

        {!isLoading && filteredUsers && filteredUsers.length > 0 && (
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredUsers.map((user) => {
              const isAssigned = isUserAssigned(user.id);
              return (
                <div
                  key={user.id}
                  className={`p-4 border-b border-gray-100 last:border-b-0 ${
                    isAssigned ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.firstName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          <span className="px-2 py-0.5 bg-gray-200 rounded-md">{user.role}</span>
                        </div>
                      </div>
                    </div>

                    {!isAssigned && (
                      <div className="flex gap-2">
                        {!selectedSiteManager && (
                          <button
                            onClick={() => handleSelectSiteManager(user)}
                            className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1"
                            title="Als Objektleiter zuweisen"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                            Objektleiter
                          </button>
                        )}
                        <button
                          onClick={() => handleAddShiftLeader(user)}
                          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1"
                          title="Als Schichtleiter hinzufügen"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Schichtleiter
                        </button>
                        <button
                          onClick={() => handleAddAdditionalStaff(user)}
                          className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
                          title="Als Mitarbeiter hinzufügen"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Mitarbeiter
                        </button>
                      </div>
                    )}

                    {isAssigned && (
                      <div className="text-xs text-gray-500 bg-gray-200 px-3 py-1.5 rounded-md">
                        Bereits zugewiesen
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Warning if not enough staff */}
      {totalAssigned < requiredStaff && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-900 mb-1">
                Noch nicht genug Mitarbeiter zugewiesen
              </div>
              <p className="text-sm text-yellow-700">
                Laut Sicherheitskonzept werden <strong>{requiredStaff}</strong> Mitarbeiter benötigt.
                Sie haben bisher <strong>{totalAssigned}</strong> zugewiesen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
        >
          ← Zurück zu Schritt 3
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          Weiter zu Schritt 5
          <span className="text-sm opacity-75">→</span>
        </button>
      </div>
    </div>
  );
}
