# 🚀 Escolta Pro: Complete Implementation Guide

## Phase 1: Role-Based Navigation & Route Guards

### Step 1: Enhanced Role System
```typescript
// Update user roles enum
type UserRole = 'client' | 'guard' | 'company_admin' | 'super_admin'

// Create role-based navigation component
const RoleBasedNav = ({ userRole }: { userRole: UserRole }) => {
  const navItems = {
    client: [
      { path: '/book', label: 'Book Protection', icon: Shield },
      { path: '/bookings', label: 'My Bookings', icon: Calendar },
      { path: '/payment-methods', label: 'Payment Methods', icon: CreditCard },
      { path: '/profile', label: 'Profile', icon: User }
    ],
    guard: [
      { path: '/available-jobs', label: 'Available Jobs', icon: Briefcase },
      { path: '/my-jobs', label: 'My Jobs', icon: Clock },
      { path: '/earnings', label: 'Earnings', icon: DollarSign },
      { path: '/documents', label: 'Documents', icon: FileText },
      { path: '/profile', label: 'Profile', icon: User }
    ],
    company_admin: [
      { path: '/job-pipeline', label: 'Job Pipeline', icon: Workflow },
      { path: '/team', label: 'Team Management', icon: Users },
      { path: '/fleet', label: 'Fleet Management', icon: Car },
      { path: '/analytics', label: 'Analytics', icon: BarChart },
      { path: '/company-profile', label: 'Company Profile', icon: Building }
    ],
    super_admin: [
      { path: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/approvals', label: 'Approvals', icon: CheckCircle },
      { path: '/user-management', label: 'Users', icon: UserCog },
      { path: '/financial-overview', label: 'Financials', icon: TrendingUp },
      { path: '/system-health', label: 'System Health', icon: Activity }
    ]
  }
  
  return navItems[userRole] || []
}
```

### Step 2: Enhanced Profile Components

```typescript
// Client Profile Form
const ClientProfileForm = () => {
  return (
    <form>
      {/* Basic Info */}
      <Input name="first_name" label="First Name" required />
      <Input name="last_name" label="Last Name" required />
      <Input name="phone_e164" label="Phone" type="phone" required />
      
      {/* Emergency Contact */}
      <Card>
        <CardHeader>Emergency Contact</CardHeader>
        <CardContent>
          <Input name="emergency_contact.name" label="Name" />
          <Input name="emergency_contact.relationship" label="Relationship" />
          <Input name="emergency_contact.phone" label="Phone" />
        </CardContent>
      </Card>
      
      {/* Document Upload */}
      <DocumentUpload 
        type="id_document" 
        required 
        acceptedTypes={['image/*', 'application/pdf']}
        maxSize={10 * 1024 * 1024} // 10MB
      />
      
      {/* Saved Addresses */}
      <AddressManager addresses={savedAddresses} onChange={setSavedAddresses} />
    </form>
  )
}

// Guard Profile Form  
const GuardProfileForm = () => {
  return (
    <form>
      {/* Profile Photo - Required */}
      <ImageUpload 
        name="profile_photo" 
        label="Profile Photo" 
        required 
        aspectRatio="1:1"
        maxSize={5 * 1024 * 1024}
      />
      
      {/* Service Details */}
      <Input 
        name="hourly_rate_mxn_cents" 
        label="Hourly Rate (MXN)" 
        type="currency"
        currency="MXN"
        required 
      />
      
      <Checkbox name="armed_services" label="Offer Armed Protection Services" />
      {armedServices && (
        <Input 
          name="armed_surcharge_mxn_cents" 
          label="Armed Services Surcharge (MXN/hr)"
          type="currency" 
        />
      )}
      
      {/* Vehicle Information */}
      <Checkbox name="has_vehicle" label="I have a vehicle for client transport" />
      {hasVehicle && <VehicleDetailsForm />}
      
      {/* Document Uploads */}
      <DocumentUpload type="security_license" required />
      <DocumentUpload type="training_certificates" multiple />
      <DocumentUpload type="insurance_certificate" required />
    </form>
  )
}
```

## Phase 2: Stripe Connect Integration

### Step 3: Stripe Connect Onboarding

```typescript
// Create stripe_connect_onboarding edge function
export const stripeConnectOnboarding = async (req: Request) => {
  const { user_type } = await req.json() // 'guard' or 'company'
  
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'MX',
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    },
    business_type: user_type === 'company' ? 'company' : 'individual'
  })
  
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${origin}/stripe-connect/refresh`,
    return_url: `${origin}/stripe-connect/success`,
    type: 'account_onboarding'
  })
  
  // Save account ID to user profile
  await supabase
    .from('profiles')
    .update({ stripe_connect_account_id: account.id })
    .eq('id', user.id)
    
  return { url: accountLink.url }
}

// Frontend integration
const StripeConnectButton = () => {
  const handleConnect = async () => {
    const { data } = await supabase.functions.invoke('stripe_connect_onboarding', {
      body: { user_type: userRole === 'company_admin' ? 'company' : 'guard' }
    })
    
    if (data?.url) {
      window.open(data.url, '_blank')
    }
  }
  
  return (
    <Button onClick={handleConnect} className="w-full">
      <ExternalLink className="h-4 w-4 mr-2" />
      Connect Bank Account with Stripe
    </Button>
  )
}
```

### Step 4: Client Payment Methods

```typescript
// Payment methods management component
const PaymentMethodsManager = () => {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [adding, setAdding] = useState(false)
  
  const addPaymentMethod = async (paymentMethodId: string) => {
    await supabase.functions.invoke('save_payment_method', {
      body: { payment_method_id: paymentMethodId, is_default: paymentMethods.length === 0 }
    })
    
    loadPaymentMethods()
  }
  
  return (
    <div className="space-y-4">
      {paymentMethods.map(pm => (
        <Card key={pm.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5" />
              <div>
                <p className="font-medium">**** **** **** {pm.last_four}</p>
                <p className="text-sm text-muted-foreground">
                  {pm.brand.toUpperCase()} • Expires {pm.exp_month}/{pm.exp_year}
                </p>
              </div>
              {pm.is_default && <Badge>Default</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => deletePaymentMethod(pm.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
      
      <Button onClick={() => setAdding(true)} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Payment Method
      </Button>
      
      {adding && <StripePaymentMethodForm onComplete={addPaymentMethod} />}
    </div>
  )
}
```

## Phase 3: Enhanced Booking Flow

### Step 5: Service Configuration & Pricing

```typescript
// Enhanced booking form with pricing
const BookingForm = () => {
  const [serviceConfig, setServiceConfig] = useState({
    armed_required: false,
    vehicle_required: false,
    vehicle_type: 'suv',
    duration_hours: 4, // Minimum enforced
    special_requests: ''
  })
  
  const [pricing, setPricing] = useState({
    base_rate_mxn_cents: 0,
    armed_surcharge_mxn_cents: 0,
    vehicle_rate_mxn_cents: 0,
    subtotal_mxn_cents: 0,
    service_fee_mxn_cents: 0, // 10%
    total_mxn_cents: 0
  })
  
  // Real-time pricing calculation
  useEffect(() => {
    calculatePricing()
  }, [serviceConfig, selectedGuard])
  
  const calculatePricing = () => {
    const base = selectedGuard.hourly_rate_mxn_cents * serviceConfig.duration_hours
    const armed = serviceConfig.armed_required ? 
      (selectedGuard.armed_hourly_surcharge_mxn_cents * serviceConfig.duration_hours) : 0
    const vehicle = serviceConfig.vehicle_required ? 
      (selectedGuard.vehicle_hourly_rate_mxn_cents * serviceConfig.duration_hours) : 0
    
    const subtotal = base + armed + vehicle
    const serviceFee = Math.round(subtotal * 0.10) // 10% service fee
    const total = subtotal + serviceFee
    
    setPricing({
      base_rate_mxn_cents: base,
      armed_surcharge_mxn_cents: armed,
      vehicle_rate_mxn_cents: vehicle,
      subtotal_mxn_cents: subtotal,
      service_fee_mxn_cents: serviceFee,
      total_mxn_cents: total
    })
  }
  
  return (
    <form>
      {/* Service Configuration */}
      <Card>
        <CardHeader>Service Requirements</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="armed"
              checked={serviceConfig.armed_required}
              onCheckedChange={(checked) => 
                setServiceConfig(prev => ({ ...prev, armed_required: checked }))
              }
            />
            <Label htmlFor="armed">Armed Protection Required</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="vehicle"
              checked={serviceConfig.vehicle_required}
              onCheckedChange={(checked) => 
                setServiceConfig(prev => ({ ...prev, vehicle_required: checked }))
              }
            />
            <Label htmlFor="vehicle">Vehicle Transport Required</Label>
          </div>
          
          {serviceConfig.vehicle_required && (
            <Select 
              value={serviceConfig.vehicle_type}
              onValueChange={(value) => 
                setServiceConfig(prev => ({ ...prev, vehicle_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="armored">Armored Vehicle</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <div>
            <Label>Duration (minimum 4 hours)</Label>
            <Input 
              type="number" 
              min={4}
              value={serviceConfig.duration_hours}
              onChange={(e) => 
                setServiceConfig(prev => ({ 
                  ...prev, 
                  duration_hours: Math.max(4, parseInt(e.target.value))
                }))
              }
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>Pricing Breakdown</CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Base Rate ({serviceConfig.duration_hours} hrs)</span>
            <span>{formatMXN(pricing.base_rate_mxn_cents)}</span>
          </div>
          
          {serviceConfig.armed_required && (
            <div className="flex justify-between">
              <span>Armed Services Surcharge</span>
              <span>{formatMXN(pricing.armed_surcharge_mxn_cents)}</span>
            </div>
          )}
          
          {serviceConfig.vehicle_required && (
            <div className="flex justify-between">
              <span>Vehicle Service</span>
              <span>{formatMXN(pricing.vehicle_rate_mxn_cents)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMXN(pricing.subtotal_mxn_cents)}</span>
          </div>
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Service Fee (10%)</span>
            <span>{formatMXN(pricing.service_fee_mxn_cents)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatMXN(pricing.total_mxn_cents)}</span>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
```

## Phase 4: Company Workflows

### Step 6: Job Pipeline Management

```typescript
// Company job pipeline component
const JobPipelineManager = () => {
  const [jobs, setJobs] = useState({
    available: [],
    claimed: [],
    assigned: [],
    active: [],
    completed: []
  })
  
  const claimJob = async (jobId: string) => {
    await supabase.functions.invoke('company_claim_job', {
      body: { job_id: jobId }
    })
    
    loadJobs()
  }
  
  const assignStaff = async (jobId: string, guardId: string, vehicleId?: string) => {
    await supabase.functions.invoke('assign_staff_to_job', {
      body: { 
        job_id: jobId, 
        guard_id: guardId, 
        vehicle_id: vehicleId 
      }
    })
    
    loadJobs()
  }
  
  return (
    <Tabs defaultValue="available">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="available">Available ({jobs.available.length})</TabsTrigger>
        <TabsTrigger value="claimed">Claimed ({jobs.claimed.length})</TabsTrigger>
        <TabsTrigger value="assigned">Assigned ({jobs.assigned.length})</TabsTrigger>
        <TabsTrigger value="active">Active ({jobs.active.length})</TabsTrigger>
        <TabsTrigger value="completed">Completed ({jobs.completed.length})</TabsTrigger>
      </TabsList>
      
      <TabsContent value="available">
        <div className="space-y-4">
          {jobs.available.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              actions={
                <Button onClick={() => claimJob(job.id)}>
                  <Building className="h-4 w-4 mr-2" />
                  Claim for Company
                </Button>
              }
            />
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="claimed">
        <div className="space-y-4">
          {jobs.claimed.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              actions={<StaffAssignmentDialog job={job} onAssign={assignStaff} />}
            />
          ))}
        </div>
      </TabsContent>
      
      {/* Other tabs... */}
    </Tabs>
  )
}

// Staff assignment dialog
const StaffAssignmentDialog = ({ job, onAssign }) => {
  const [selectedGuard, setSelectedGuard] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [availableGuards, setAvailableGuards] = useState([])
  const [availableVehicles, setAvailableVehicles] = useState([])
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Assign Staff
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Staff to Job</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guard Selection */}
          <div>
            <Label>Select Guard</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableGuards.map(guard => (
                <Card 
                  key={guard.id}
                  className={`cursor-pointer transition-colors ${
                    selectedGuard?.id === guard.id ? 'bg-primary/10 border-primary' : ''
                  }`}
                  onClick={() => setSelectedGuard(guard)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={guard.profile_photo} />
                        <AvatarFallback>{guard.first_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{guard.first_name} {guard.last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ⭐ {guard.rating} • {guard.total_jobs} jobs
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Vehicle Selection (if required) */}
          {job.vehicle_required && (
            <div>
              <Label>Select Vehicle</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableVehicles.map(vehicle => (
                  <Card 
                    key={vehicle.id}
                    className={`cursor-pointer transition-colors ${
                      selectedVehicle?.id === vehicle.id ? 'bg-primary/10 border-primary' : ''
                    }`}
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Car className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{vehicle.make_model}</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.type.toUpperCase()} • {vehicle.license_plate}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onAssign(job.id, selectedGuard?.id, selectedVehicle?.id)}
            disabled={!selectedGuard || (job.vehicle_required && !selectedVehicle)}
          >
            Assign Staff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Phase 5: Super Admin Panel

### Step 7: Enhanced Admin Dashboard

```typescript
// Super admin dashboard with real-time metrics
const SuperAdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    platform_health: {
      active_users: 0,
      daily_bookings: 0,
      revenue_today_mxn: 0,
      system_uptime: 99.9
    },
    verification_queue: {
      pending_guards: 0,
      pending_companies: 0,
      pending_documents: 0
    },
    financial_overview: {
      total_gmv_mxn: 0,
      platform_revenue_mxn: 0,
      pending_payouts_mxn: 0
    }
  })
  
  return (
    <div className="space-y-6">
      {/* Platform Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Users"
          value={metrics.platform_health.active_users}
          icon={Users}
          trend="+12%"
          trendUp={true}
        />
        
        <MetricCard
          title="Daily Bookings"
          value={metrics.platform_health.daily_bookings}
          icon={Calendar}
          trend="+8%"
          trendUp={true}
        />
        
        <MetricCard
          title="Revenue Today"
          value={formatMXN(metrics.platform_health.revenue_today_mxn * 100)}
          icon={DollarSign}
          trend="+15%"
          trendUp={true}
        />
        
        <MetricCard
          title="System Uptime"
          value={`${metrics.platform_health.system_uptime}%`}
          icon={Activity}
          trend="99.9%"
          trendUp={true}
        />
      </div>
      
      {/* Verification Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Verification Queue</CardTitle>
          <Badge variant="secondary">
            {metrics.verification_queue.pending_guards + 
             metrics.verification_queue.pending_companies + 
             metrics.verification_queue.pending_documents} total
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{metrics.verification_queue.pending_guards}</p>
              <p className="text-sm text-muted-foreground">Pending Guards</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Building className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{metrics.verification_queue.pending_companies}</p>
              <p className="text-sm text-muted-foreground">Pending Companies</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{metrics.verification_queue.pending_documents}</p>
              <p className="text-sm text-muted-foreground">Pending Documents</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button className="h-20 text-left justify-start" variant="outline">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-medium">Review Approvals</p>
              <p className="text-sm text-muted-foreground">
                {metrics.verification_queue.pending_guards + metrics.verification_queue.pending_companies} pending
              </p>
            </div>
          </div>
        </Button>
        
        <Button className="h-20 text-left justify-start" variant="outline">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <div>
              <p className="font-medium">Financial Reports</p>
              <p className="text-sm text-muted-foreground">
                {formatMXN(metrics.financial_overview.platform_revenue_mxn * 100)} this month
              </p>
            </div>
          </div>
        </Button>
        
        <Button className="h-20 text-left justify-start" variant="outline">
          <div className="flex items-center gap-3">
            <UserCog className="h-6 w-6 text-purple-500" />
            <div>
              <p className="font-medium">User Management</p>
              <p className="text-sm text-muted-foreground">
                {metrics.platform_health.active_users} active users
              </p>
            </div>
          </div>
        </Button>
      </div>
      
      {/* System Health Chart */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance (Last 24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={systemHealthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="response_time" 
                stroke="hsl(var(--primary))" 
                name="Response Time (ms)"
              />
              <Line 
                type="monotone" 
                dataKey="active_sessions" 
                stroke="hsl(var(--secondary))" 
                name="Active Sessions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Phase 6: Testing Implementation

### Step 8: Playwright Test Suite

```typescript
// tests/booking-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Complete Booking Flow', () => {
  test('client can book protection service end-to-end', async ({ page }) => {
    // Login as client
    await page.goto('/auth')
    await page.fill('[data-testid="email"]', 'client@test.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Navigate to booking page
    await page.click('[data-testid="book-protection-button"]')
    
    // Search for guards
    await page.fill('[data-testid="location-input"]', 'Mexico City')
    await page.click('[data-testid="search-button"]')
    
    // Select a guard
    await page.click('[data-testid="guard-card"]:first-child')
    
    // Configure service
    await page.click('[data-testid="armed-protection-checkbox"]')
    await page.click('[data-testid="vehicle-required-checkbox"]')
    await page.selectOption('[data-testid="vehicle-type-select"]', 'suv')
    await page.fill('[data-testid="duration-input"]', '6')
    
    // Verify pricing calculation
    const totalPrice = await page.textContent('[data-testid="total-price"]')
    expect(totalPrice).toContain('MXN')
    
    // Add payment method if needed
    const paymentMethods = await page.locator('[data-testid="payment-method"]').count()
    if (paymentMethods === 0) {
      await page.click('[data-testid="add-payment-method"]')
      // Fill Stripe payment form...
    }
    
    // Confirm booking
    await page.click('[data-testid="confirm-booking-button"]')
    
    // Verify booking confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
    
    // Check booking appears in dashboard
    await page.goto('/bookings')
    await expect(page.locator('[data-testid="active-booking"]')).toBeVisible()
  })
})

// tests/admin-approvals.spec.ts
test.describe('Admin Approval Workflows', () => {
  test('super admin can approve guard application', async ({ page }) => {
    // Login as super admin
    await page.goto('/auth')
    await page.fill('[data-testid="email"]', 'admin@escoltapro.com')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    
    // Navigate to approvals
    await page.click('[data-testid="approvals-nav"]')
    
    // Review pending guard
    await page.click('[data-testid="guards-tab"]')
    const pendingGuard = page.locator('[data-testid="pending-guard"]').first()
    
    // Review documents
    await pendingGuard.locator('[data-testid="review-documents"]').click()
    
    // Approve guard
    await pendingGuard.locator('[data-testid="approve-button"]').click()
    await expect(page.locator('[data-testid="approval-success"]')).toBeVisible()
    
    // Verify guard is no longer in pending list
    await page.reload()
    const remainingPending = await page.locator('[data-testid="pending-guard"]').count()
    expect(remainingPending).toBeLessThan(1)
  })
})

// tests/payout-flow.spec.ts
test.describe('Payout Flow', () => {
  test('guard can connect Stripe and receive payout', async ({ page }) => {
    // Login as guard
    await page.goto('/auth')
    await page.fill('[data-testid="email"]', 'guard@test.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Go to earnings page
    await page.click('[data-testid="earnings-nav"]')
    
    // Connect Stripe account
    const [stripePopup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('[data-testid="connect-stripe-button"]')
    ])
    
    // Handle Stripe Connect flow (simplified for test)
    await stripePopup.waitForLoadState()
    // Stripe Connect mock interactions...
    await stripePopup.close()
    
    // Verify connection
    await expect(page.locator('[data-testid="stripe-connected"]')).toBeVisible()
    
    // Check payout history
    await page.click('[data-testid="payout-history-tab"]')
    await expect(page.locator('[data-testid="payout-item"]')).toBeVisible()
  })
})
```

## Phase 7: i18n Completion

### Step 9: Complete Translation Coverage

```typescript
// lib/i18n.ts - Extended translations
export const dict: Record<Lang, Record<string, string>> = {
  en: {
    // ... existing translations
    
    // Booking Flow
    search_guards: 'Search Guards',
    filter_by_location: 'Filter by Location', 
    filter_by_rating: 'Filter by Rating',
    filter_by_price: 'Filter by Price Range',
    armed_protection: 'Armed Protection',
    vehicle_transport: 'Vehicle Transport',
    service_duration: 'Service Duration',
    minimum_4_hours: 'Minimum 4 hours required',
    pricing_breakdown: 'Pricing Breakdown',
    base_hourly_rate: 'Base Hourly Rate',
    armed_surcharge: 'Armed Protection Surcharge',
    vehicle_rate: 'Vehicle Service Rate',
    platform_fee: 'Platform Service Fee (10%)',
    total_cost: 'Total Cost',
    
    // Payment Methods
    payment_methods: 'Payment Methods',
    add_card: 'Add Credit/Debit Card',
    default_method: 'Default Payment Method',
    card_ending: 'Card ending in',
    expires: 'Expires',
    set_as_default: 'Set as Default',
    remove_card: 'Remove Card',
    
    // Guard Profile
    hourly_rate: 'Hourly Rate',
    armed_services_available: 'Armed Protection Services Available',
    armed_hourly_surcharge: 'Armed Services Hourly Surcharge',
    vehicle_available: 'Vehicle Available for Transport',
    vehicle_type: 'Vehicle Type',
    vehicle_hourly_rate: 'Vehicle Hourly Rate',
    service_areas: 'Service Areas',
    languages_spoken: 'Languages Spoken',
    years_experience: 'Years of Experience',
    
    // Company Management
    team_management: 'Team Management',
    add_guard: 'Add Guard',
    guard_roster: 'Guard Roster',
    fleet_management: 'Fleet Management',
    add_vehicle: 'Add Vehicle',
    vehicle_roster: 'Vehicle Roster',
    job_pipeline: 'Job Pipeline',
    claim_job: 'Claim Job',
    assign_staff: 'Assign Staff',
    
    // Admin Panel
    verification_queue: 'Verification Queue',
    pending_approvals: 'Pending Approvals', 
    approve_guard: 'Approve Guard',
    approve_company: 'Approve Company',
    reject_application: 'Reject Application',
    suspend_account: 'Suspend Account',
    platform_metrics: 'Platform Metrics',
    financial_overview: 'Financial Overview',
    system_health: 'System Health',
    user_management: 'User Management',
    
    // Status Messages
    booking_confirmed: 'Booking Confirmed',
    guard_assigned: 'Guard Assigned',
    guard_en_route: 'Guard En Route',
    service_started: 'Service Started',
    service_completed: 'Service Completed',
    payment_processed: 'Payment Processed',
    payout_released: 'Payout Released',
    
    // Notifications
    new_booking_request: 'New Booking Request',
    booking_accepted: 'Your booking has been accepted',
    guard_arriving: 'Your guard is arriving in 10 minutes',
    service_reminder: 'Service starts in 1 hour',
    payment_receipt: 'Payment receipt for your service',
    payout_notification: 'Payout of {{amount}} has been processed',
    
    // Error Messages
    booking_failed: 'Booking failed. Please try again.',
    payment_failed: 'Payment processing failed',
    insufficient_funds: 'Insufficient funds on payment method',
    guard_unavailable: 'Selected guard is no longer available',
    service_area_unavailable: 'Service not available in your area',
    
    // Success Messages
    profile_updated: 'Profile updated successfully',
    payment_method_added: 'Payment method added successfully',
    documents_uploaded: 'Documents uploaded for review',
    stripe_connected: 'Bank account connected successfully',
    guard_approved: 'Guard application approved',
    company_approved: 'Company application approved'
  },
  
  es: {
    // ... existing Spanish translations
    
    // Booking Flow
    search_guards: 'Buscar Escoltas',
    filter_by_location: 'Filtrar por Ubicación',
    filter_by_rating: 'Filtrar por Calificación', 
    filter_by_price: 'Filtrar por Rango de Precio',
    armed_protection: 'Protección Armada',
    vehicle_transport: 'Transporte en Vehículo',
    service_duration: 'Duración del Servicio',
    minimum_4_hours: 'Mínimo 4 horas requeridas',
    pricing_breakdown: 'Desglose de Precios',
    base_hourly_rate: 'Tarifa Base por Hora',
    armed_surcharge: 'Recargo por Protección Armada',
    vehicle_rate: 'Tarifa de Servicio de Vehículo',
    platform_fee: 'Comisión de Plataforma (10%)',
    total_cost: 'Costo Total',
    
    // Payment Methods
    payment_methods: 'Métodos de Pago',
    add_card: 'Agregar Tarjeta de Crédito/Débito',
    default_method: 'Método de Pago Predeterminado',
    card_ending: 'Tarjeta terminada en',
    expires: 'Vence',
    set_as_default: 'Establecer como Predeterminado',
    remove_card: 'Eliminar Tarjeta',
    
    // Guard Profile
    hourly_rate: 'Tarifa por Hora',
    armed_services_available: 'Servicios de Protección Armada Disponibles',
    armed_hourly_surcharge: 'Recargo por Hora de Servicios Armados',
    vehicle_available: 'Vehículo Disponible para Transporte',
    vehicle_type: 'Tipo de Vehículo',
    vehicle_hourly_rate: 'Tarifa por Hora del Vehículo',
    service_areas: 'Áreas de Servicio',
    languages_spoken: 'Idiomas Hablados',
    years_experience: 'Años de Experiencia',
    
    // Company Management
    team_management: 'Gestión de Equipo',
    add_guard: 'Agregar Escolta',
    guard_roster: 'Lista de Escoltas',
    fleet_management: 'Gestión de Flota',
    add_vehicle: 'Agregar Vehículo',
    vehicle_roster: 'Lista de Vehículos',
    job_pipeline: 'Pipeline de Trabajos',
    claim_job: 'Reclamar Trabajo',
    assign_staff: 'Asignar Personal',
    
    // Admin Panel
    verification_queue: 'Cola de Verificación',
    pending_approvals: 'Aprobaciones Pendientes',
    approve_guard: 'Aprobar Escolta',
    approve_company: 'Aprobar Empresa',
    reject_application: 'Rechazar Aplicación',
    suspend_account: 'Suspender Cuenta',
    platform_metrics: 'Métricas de Plataforma',
    financial_overview: 'Resumen Financiero',
    system_health: 'Salud del Sistema',
    user_management: 'Gestión de Usuarios',
    
    // Status Messages
    booking_confirmed: 'Reserva Confirmada',
    guard_assigned: 'Escolta Asignado',
    guard_en_route: 'Escolta en Camino',
    service_started: 'Servicio Iniciado',
    service_completed: 'Servicio Completado',
    payment_processed: 'Pago Procesado',
    payout_released: 'Pago Liberado',
    
    // Notifications
    new_booking_request: 'Nueva Solicitud de Reserva',
    booking_accepted: 'Tu reserva ha sido aceptada',
    guard_arriving: 'Tu escolta llegará en 10 minutos',
    service_reminder: 'El servicio comienza en 1 hora',
    payment_receipt: 'Recibo de pago por tu servicio',
    payout_notification: 'El pago de {{amount}} ha sido procesado',
    
    // Error Messages
    booking_failed: 'La reserva falló. Por favor intenta de nuevo.',
    payment_failed: 'El procesamiento del pago falló',
    insufficient_funds: 'Fondos insuficientes en el método de pago',
    guard_unavailable: 'El escolta seleccionado ya no está disponible',
    service_area_unavailable: 'Servicio no disponible en tu área',
    
    // Success Messages
    profile_updated: 'Perfil actualizado exitosamente',
    payment_method_added: 'Método de pago agregado exitosamente',
    documents_uploaded: 'Documentos subidos para revisión',
    stripe_connected: 'Cuenta bancaria conectada exitosamente',
    guard_approved: 'Aplicación de escolta aprobada',
    company_approved: 'Aplicación de empresa aprobada'
  }
}
```

## Phase 8: Final Production Optimizations

### Step 10: Performance & Security Enhancements

```typescript
// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const trackPageLoad = (pageName: string) => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigationEntry) {
      const metrics = {
        page: pageName,
        load_time: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
        dom_content_loaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
        first_byte: navigationEntry.responseStart - navigationEntry.requestStart,
        dns_lookup: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart
      }
      
      // Send to analytics
      supabase.functions.invoke('performance_monitor', { body: metrics })
    }
  }
  
  const trackUserInteraction = (action: string, element: string, duration?: number) => {
    supabase.functions.invoke('performance_monitor', {
      body: {
        type: 'interaction',
        action,
        element,
        duration,
        timestamp: Date.now()
      }
    })
  }
  
  return { trackPageLoad, trackUserInteraction }
}

// Error boundary with reporting
export const ErrorBoundaryWithReporting = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Report to Supabase
        supabase.functions.invoke('error_tracking', {
          body: {
            error: error.message,
            stack: error.stack,
            component_stack: errorInfo.componentStack,
            url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Security headers edge function
export const securityHeaders = (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com https://*.supabase.co"
  }
  
  return corsHeaders
}
```

---

## 🎯 Implementation Checklist

### ✅ Database & Backend
- [ ] Enhanced profile tables with verification fields
- [ ] Payment methods table with Stripe integration
- [ ] Reviews and notifications tables
- [ ] Updated RLS policies for all new tables
- [ ] Edge functions for Stripe Connect, payments, notifications
- [ ] Document upload with virus scanning
- [ ] Performance monitoring endpoints

### ✅ Frontend Components  
- [ ] Role-based navigation with route guards
- [ ] Enhanced profile forms for each user type
- [ ] Stripe Connect onboarding flows
- [ ] Payment methods management
- [ ] Advanced booking form with real-time pricing
- [ ] Company job pipeline management
- [ ] Super admin dashboard with metrics
- [ ] Document upload with progress tracking

### ✅ User Experience
- [ ] Complete booking flow from search to completion
- [ ] Real-time job status updates
- [ ] Push notifications for key events
- [ ] Multi-language support (EN/ES)
- [ ] Mobile-responsive design
- [ ] Accessible components with ARIA labels

### ✅ Payments & Financials
- [ ] Stripe Connect for guards and companies
- [ ] Escrow payment system with 10% platform fee
- [ ] Automatic payout calculations and splits
- [ ] Invoice generation and payment history
- [ ] Currency formatting for MXN
- [ ] Tax calculation helpers

### ✅ Security & Compliance
- [ ] Document verification workflows
- [ ] Secure file upload with signed URLs
- [ ] Role-based access controls
- [ ] Data encryption at rest and in transit
- [ ] GDPR-compliant data handling
- [ ] Audit trails for admin actions

### ✅ Testing & Monitoring
- [ ] Playwright end-to-end tests
- [ ] Unit tests for critical components
- [ ] Performance monitoring with Web Vitals
- [ ] Error tracking and reporting
- [ ] Load testing for high concurrency
- [ ] Security vulnerability scanning

### ✅ Production Ready
- [ ] Environment configuration
- [ ] CDN setup for static assets
- [ ] Database connection pooling
- [ ] Caching strategies
- [ ] Monitoring and alerting
- [ ] Backup and disaster recovery
- [ ] Documentation for operations team

---

This comprehensive implementation guide transforms Escolta Pro into a world-class security marketplace platform with enterprise-grade features, security, and scalability. The modular approach allows for iterative development while maintaining system integrity throughout the implementation process.
