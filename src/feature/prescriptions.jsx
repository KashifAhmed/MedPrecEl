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
  const [editPrescription, setEditPrescription] = useState(null);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const query = {};
  
      // Set filter parameters
      if (searchFilters.patient_id) {
        query.patient_id = parseInt(searchFilters.patient_id);
      }
      if (searchFilters.doctor_id) {
        query.doctor_id = parseInt(searchFilters.doctor_id);
      }
  
      let allPrescriptions = [];
      let currentPage = 1;
      let lastPage = 1;
  
      // Fetch records from all pages
      while (currentPage <= lastPage) {
        const prescriptionResponse = await api.prescriptions.get({
          ...query,
          page: currentPage
        });
  
        // If there are records on the current page, process them
        if (prescriptionResponse?.data.length > 0) {
          console.log(`Precription Data length ${prescriptionResponse.data.length} ${currentPage}`)
          allPrescriptions = [...allPrescriptions, ...prescriptionResponse.data];
          lastPage = prescriptionResponse.meta?.last_page || 1; // Get last page from meta
          currentPage++;
        } else {
          break; // No more pages, break the loop
        }
      }
  
      // Add all fetched prescriptions to the database
      for (const prescription of allPrescriptions) {
        const presDate = new Date(prescription.date);
        const presObject = {
          _id: `prec-${prescription.id}`,
          patient_id: prescription.patient.id,
          doctor_id: prescription.doctor.id,
          date: `${presDate.getFullYear()}-${presDate.getMonth() + 1}-${presDate.getDate()}`,
          content: prescription.content,
          created_at: prescription.created_at
        };
        console.log('ADDING presObject', presObject)
        const pouchAddRes = await window.electron.db.prescriptions.add(presObject);
        console.log('Pres pouch res', pouchAddRes);
      }
  
      // Fetch all prescriptions from the database based on the filters
      const result = await window.electron.db.prescriptions.search(query);
      console.log('Search result', result);
      if (result.success) {
        setPrescriptions(result.data);
      }
    } finally {
      setLoading(false);
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
                        value={editPrescription?.content}
                        onChange={(e) => setEditPrescription({
                          ...editPrescription,
                          content: e.target.value
                        })}
                        className="min-h-[200px] mt-4"
                      />
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setEditPrescription(null)}>Cancel</Button>
                        <Button>Save</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="ghost" size="icon" className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
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