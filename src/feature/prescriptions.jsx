import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { 
  Eye, 
  Trash2, 
  Edit,
  Search,
  CheckCircle2,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";

const PrescriptionList = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({
    patient_id: 16,
    doctor_id: 3
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false});

  const handleSearch = async () => {
    const query = {
      patient_id: searchFilters.patient_id,
      doctor_id: searchFilters.doctor_id,
    };
   
    try {
      // Immediately load from local database
      const localResult = await window.electron.db.prescriptions.search(query);
      
      console.log('--- LOCAL RESULT ----')
      console.log(localResult)
      if (localResult.success) {
        setPrescriptions(localResult.data);
        setLoading(false);
      }
   
      // Background API fetch and append
      const fetchAndAppendApiResults = async () => {
        try {
          const apiPrescriptions = await fetchPrescriptionsFromAPI(query);
          
          // Track unique prescriptions to save
          const uniquePrescriptionsToSave = [];
          
          setPrescriptions(prevPrescriptions => {
            const seenIds = new Set(prevPrescriptions.map(p => p._id));
            
            const newUniquePrescriptions = apiPrescriptions.filter(
              newPres => {
                const isUnique = !seenIds.has(newPres._id);
                if (isUnique) {
                  uniquePrescriptionsToSave.push(newPres);
                }
                return isUnique;
              }
            );
       
            // Save unique prescriptions to PouchDB
            uniquePrescriptionsToSave.forEach(async (prescription) => {
              await window.electron.db.prescriptions.add(prescription);
            });
       
            console.log('Unique New Prescriptions:', uniquePrescriptionsToSave);
         
            return [...prevPrescriptions, ...newUniquePrescriptions];
          });
        } catch (error) {
          console.error('Background API fetch error:', error);
        }
       };
   
      // Start background fetch without blocking
      fetchAndAppendApiResults();
   
    } catch (error) {
      console.error('Search error:', error);
    }
  };
  
  const fetchPrescriptionsFromAPI = async (query) => {
    let allPrescriptions = [];
    let currentPage = 1;
    let lastPage = 1;
  
    while (currentPage <= lastPage) {
      const prescriptionResponse = await api.prescriptions.get({ ...query, page: currentPage });
  
      if (prescriptionResponse?.data.length > 0) {
        allPrescriptions = [...allPrescriptions, ...prescriptionResponse.data];
        lastPage = prescriptionResponse.meta?.last_page || 1;
        currentPage++;
      } else {
        break;
      }
    }
  
    const newPrescriptions = allPrescriptions
      .map((prescription) => ({
        _id: `prec-${prescription.id}`,
        patient_id: prescription.patient.id,
        doctor_id: prescription.doctor.id,
        date: new Date(prescription.date).toISOString().split("T")[0],
        content: prescription.content,
        created_at: prescription.created_at,
      }))
      .filter((p) => p.patient_id === query.patient_id && p.doctor_id === query.doctor_id); // Ensure strict filter
  
    // Store in local DB and return only matching records
    for (const presObject of newPrescriptions) {
      await window.electron.db.prescriptions.add(presObject);
    }
  
    return newPrescriptions;
  };
  
  const handleDelete = async (id) => {
    console.log('Deleting prescription:', id);
    if (id) {
      await window.electron.db.prescriptions.delete(id);
      setPrescriptions(prev => prev.filter(p => p._id !== id));
      setDeleteConfirmation({ show: false});
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <Input
              type="number"
              name="patient_id"
              value={searchFilters.patient_id}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))}
              placeholder="Patient ID"
            />
            <Input
              type="number"
              name="doctor_id"
              value={searchFilters.doctor_id}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))}
              placeholder="Doctor ID"
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {prescriptions.length} prescriptions found
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {prescriptions.map((prescription, index) => (
          <Card key={prescription._id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {prescription.synced ? 
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                  <Clock className="h-4 w-4 text-yellow-500" />
                }
                
                {}
                <div className="flex-1 text-sm">
                  <span>#: {index+1}</span>
                  <span className="mx-2">•</span>
                  <span className="text-muted-foreground">{new Date(prescription.date).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <span>P: {prescription.patient_id}</span>
                  <span className="mx-2">•</span>
                  <span>D: {prescription.doctor_id}</span>
                  <span className="mx-2">•</span>
                  <span>Pres_ID: {prescription._id}</span>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Prescription Details</DialogTitle>
                      </DialogHeader>
                      <div className="mt-2 text-sm whitespace-pre-wrap">
                        {prescription.content}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Prescription</DialogTitle>
                      </DialogHeader>
                      <Textarea 
                        value={prescription.content}
                        onChange={(e) => {
                          setPrescriptions(prev => prev.map(p =>
                            p._id === prescription._id ? { ...p, content: e.target.value } : p
                          ));
                        }}
                        className="min-h-[200px] mt-4"
                      />
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline">Cancel</Button>
                        <Button>Save</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-500" onClick={() => setDeleteConfirmation({ show: true })} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                      </DialogHeader>
                      <p>Are you sure you want to delete this prescription?</p>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirmation({ show: false})}>Cancel</Button>
                        <Button variant="destructive" onClick={()=>handleDelete(prescription._id)}>Delete</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PrescriptionList;
