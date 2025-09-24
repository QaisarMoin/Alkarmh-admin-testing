import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from 'react-toastify';
import * as api from "../utils/api";

function Workers() {
  const { user, authToken } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, workerId: null, workerName: '' });

  // Determine shopId for the current admin
  const shopId = user?.managedShops?.[0]?._id || user?.managedShops?.[0];

  useEffect(() => {
    if (!shopId) return;
    if (!authToken) {
      setError("You are not authenticated. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchWorkers = async () => {
      setLoading(true);
      try {
        console.log("Fetching workers for shopId:", shopId);
        const data = await api.get(`/api/shops/${shopId}/workers`);
        console.log("Workers data received:", data);
        setWorkers(data.workers || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching workers:", err);
        console.error("Error details:", err.response?.data || err.message);
        setError(
          `Failed to fetch workers: ${
            err.response?.data?.message || err.message
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [shopId, authToken]);

  const toggleWorkerStatus = async (workerId) => {
    try {
      const data = await api.put(
        `/api/shops/${shopId}/workers/${workerId}/toggle-active`
      );
      setWorkers((workers) =>
        workers.map((w) =>
          w._id === workerId ? { ...w, isActive: data.isActive } : w
        )
      );
      const worker = workers.find(w => w._id === workerId);
      toast.success(`Worker "${worker.name}" ${data.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      console.error("Error toggling worker status:", err);
      toast.error("Failed to update worker status");
    }
  };

  const openDeleteModal = (workerId, workerName) => {
    setDeleteModal({ isOpen: true, workerId, workerName });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, workerId: null, workerName: '' });
  };

  const confirmDeleteWorker = async () => {
    try {
      await api.del(`/api/shops/${shopId}/workers/${deleteModal.workerId}`);
      setWorkers((workers) => workers.filter((w) => w._id !== deleteModal.workerId));
      toast.success(`Worker "${deleteModal.workerName}" deleted successfully!`);
      setError(null);
      closeDeleteModal();
    } catch (err) {
      console.error("Error deleting worker:", err);
      toast.error("Failed to delete worker");
      closeDeleteModal();
    }
  };

  if (!shopId) return <div>No shop found for this admin.</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Workers</h2>
      {workers.length === 0 ? (
        <div className="text-gray-500">No workers found for this shop.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-6 text-left font-bold text-gray-700 tracking-wider">
                  Name
                </th>
                <th className="py-3 px-6 text-left font-bold text-gray-700 tracking-wider">
                  Email
                </th>
                <th className="py-3 px-6 text-left font-bold text-gray-700 tracking-wider">
                  Status
                </th>
                <th className="py-3 px-6 text-left font-bold text-gray-700 tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker._id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-6 border-b">{worker.name}</td>
                  <td className="py-3 px-6 border-b">{worker.email}</td>
                  <td className="py-3 px-6 border-b">
                    {worker.isActive ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-6 border-b">
                    <div className="flex items-center justify-between">
                      <button
                        className={`px-4 py-1 rounded transition ${
                          worker.isActive
                            ? "bg-yellow-500 text-white hover:bg-yellow-600"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                        onClick={() => toggleWorkerStatus(worker._id)}
                      >
                        {worker.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                        onClick={() => openDeleteModal(worker._id, worker.name)}
                        title="Delete worker"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg 
                  className="h-6 w-6 text-red-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Worker
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <strong>{deleteModal.workerName}</strong>? <br></br>
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  onClick={confirmDeleteWorker}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Workers;