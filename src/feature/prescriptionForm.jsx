import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

        


const PrescriptionForm = () => {
  const navigate = useNavigate();
  const [prescriptionData, setPrescriptionData] = useState({
    content: 'Panadol',
    date: new Date().toISOString().split('T')[0],
    doctor_id: 3,
    patient_id: 16
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await window.electron.db.prescriptions.create(prescriptionData);

      if (result.success) {
        console.log('Prescription saved:', result.id);
        setPrescriptionData({
          content: 'Panadol',
          date: new Date().toISOString().split('T')[0],
          doctor_id: 3,
          patient_id: 16
        });
        navigate('/prescriptions');        
      } else {
        throw new Error('Failed to save prescription');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prescription');
      console.error('Error saving prescription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPrescriptionData(prev => ({
      ...prev,
      [name]: name.includes('id') ? Number(value) : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Create New Prescription</h2>

        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient ID
            </label>
            <input
              type="number"
              name="patient_id"
              value={prescriptionData.patient_id}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor ID
            </label>
            <input
              type="number"
              name="patient_id"
              value={prescriptionData.doctor_id}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={prescriptionData.date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              name="content"
              value={prescriptionData.content}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 h-32"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {loading ? 'Creating...' : 'Create Prescription'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionForm;