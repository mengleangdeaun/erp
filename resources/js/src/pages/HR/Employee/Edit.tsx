import { useParams } from 'react-router-dom';
import EmployeeForm from './Form';

const EmployeeEdit = () => {
    const { id } = useParams<{ id: string }>();
    return <EmployeeForm employeeId={Number(id)} />;
};

export default EmployeeEdit;
