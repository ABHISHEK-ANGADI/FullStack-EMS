import React, { useCallback, useEffect, useState } from 'react'
import { dummyEmployeeData, dummyPayslipData } from '../assets/assets'
import Loading from '../components/Loading'
import PayslipsList from '../components/payslip/PayslipsList'
import GeneratePayslips from '../components/payslip/GeneratePayslips'

const PaySlips = () => {

  const [payslips, setPayslips] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const isAdmin = true;
  
  const fetchPayslips = useCallback(async() => {
    setPayslips(dummyPayslipData)
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [])

  useEffect(() => {
    fetchPayslips()
  }, [fetchPayslips])

  useEffect(() => {
    if (isAdmin) setEmployees(dummyEmployeeData)
  }, [])


  if (loading) return <Loading />

  return (
    <div className='animate-fade-in'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
        <div>
          <h1 className='page-title'>Payslips</h1>
          <p className='page-subtitle'>
            {isAdmin ? "Generate and manage employee payslips" : "Your payslip history"}
          </p>
        </div>
        {isAdmin && <GeneratePayslips employees={employees} onSuccess={fetchPayslips} />}
      </div>
      <PayslipsList payslips={payslips} isAdmin={isAdmin} />
    </div>
  )
}

export default PaySlips