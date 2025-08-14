import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import * as api from "../utils/api";

function Workers() {
  const { user, authToken } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  //   const approveWorker = (workerId) => {
  //     fetch(`/api/shops/${shopId}/workers/${workerId}/approve`, {
  //       method: 'PUT',
  //       headers: { Authorization: `Bearer ${authToken}` }
  //     })
  //       .then(res => res.json())
  //       .then(() => {
  //         setWorkers(workers =>
  //           workers.map(w =>
  //             w._id === workerId ? { ...w, isActive: true } : w
  //           )
  //         );
  //       });
  //   };

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
    } catch (err) {
      console.error("Error toggling worker status:", err);
      setError("Failed to update worker status");
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
                  Action
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
                    <button
                      className={`px-4 py-1 rounded transition mr-2 ${
                        worker.isActive
                          ? "bg-yellow-500 text-white hover:bg-yellow-600"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                      onClick={() => toggleWorkerStatus(worker._id)}
                    >
                      {worker.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Workers;
