import { useState, useEffect } from 'react';
import api from '../api';


const PrescriptionList = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    patient_id: 16,
    doctor_id: 3
  });

  const fetchPrescriptions = async () => {
    console.log('Fetching prescriptions...');
    try {
      setLoading(true);
      const query = {};
      
      if (filters.patient_id) {
        query.patient_id = parseInt(filters.patient_id);
      }
      if (filters.doctor_id) {
        query.doctor_id = parseInt(filters.doctor_id);
      }
      if (query.patient_id && query.doctor_id) {
        try {
          const prescriptionResponse = await api.prescriptions.get(query);
          if (prescriptionResponse?.data.length>0) {
            prescriptionResponse?.data.map(prescription=>{
              console.log(prescription)
              const presDate = new Date(prescription.date)
              const presObject = {
                _id: `prec-${prescription.id}`,
                patient_id: prescription.patient.id,
                doctor_id: prescription.doctor.id,
                date: `${presDate.getFullYear()}-${presDate.getMonth()+1}-${presDate.getDate()}`,
                content: prescription.content,
                created_at: prescription.created_at
              }

              console.log("Adding new object")
              console.log(presObject)
              console.log("Adding new object")
              window.electron.db.prescriptions.add(presObject);

            })
          } else {
            throw new Error(prescriptionResponse.error);
          }
          
          console.log(prescriptionResponse);
        } catch (err) {
          console.error('Error fetching prescription:', err);
        }
      }
      
      const result = await window.electron.db.prescriptions.search(query);
      console.log('Fetching prescriptions from database...');
      console.log(result);
      if (result.success) {
        setPrescriptions(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading prescriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Patient ID
            </label>
            <input
              type="number"
              name="patient_id"
              value={filters.patient_id}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Doctor ID
            </label>
            <input
              type="number"
              name="doctor_id"
              value={filters.doctor_id}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <button 
          onClick={fetchPrescriptions}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {prescriptions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No prescriptions found
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Id
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prescriptions.map((prescription) => (
                <tr key={prescription._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription._id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(prescription.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.patient_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.doctor_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {prescription.content}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      prescription.synced 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {prescription.synced ? 'Synced' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PrescriptionList;