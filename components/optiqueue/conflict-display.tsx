"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, AlertTriangle, Clock, User, Wrench, Building, Zap } from "lucide-react"
import { ConflictConstraint, ConflictAnalysis } from "./conflict-detector"
import { cn } from "@/lib/utils"

interface ConflictDisplayProps {
  conflicts: ConflictAnalysis
  onResolveConflicts?: () => void
  showSampleConflicts?: boolean
}

export function ConflictDisplay({ conflicts, onResolveConflicts, showSampleConflicts = false }: ConflictDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(new Set())

  const handleResolveConflict = (conflictId: string) => {
    setResolvedConflicts(prev => new Set([...prev, conflictId]))
  }

  const handleResolveAll = () => {
    const allConflictIds = conflicts.conflicts.map(c => c.id)
    setResolvedConflicts(new Set(allConflictIds))
    onResolveConflicts?.()
  }

  const getConflictIcon = (type: ConflictConstraint['type']) => {
    switch (type) {
      case 'surgeon':
        return <User className="w-4 h-4" />
      case 'equipment':
        return <Wrench className="w-4 h-4" />
      case 'time':
        return <Clock className="w-4 h-4" />
      case 'ot':
        return <Building className="w-4 h-4" />
      case 'priority':
        return <Zap className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: ConflictConstraint['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-black'
      case 'low':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const activeConflicts = conflicts.conflicts.filter(c => !resolvedConflicts.has(c.id))

  if (conflicts.totalConflicts === 0 && !showSampleConflicts) {
    return (
      <Card className="control-tower-card border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
            </div>
            <div>
              <h3 className="font-semibold text-green-800">No Conflicts Detected</h3>
              <p className="text-sm text-green-600">All surgeries are properly scheduled without conflicts.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="control-tower-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Conflict Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                {conflicts.totalConflicts} conflicts detected, {conflicts.criticalConflicts} critical
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            {activeConflicts.length > 0 && (
              <Button
                size="sm"
                onClick={handleResolveAll}
                className="bg-green-600 hover:bg-green-700"
              >
                Resolve All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          {/* Make the conflict analysis panel independently scrollable so it doesn't scroll the whole page */}
          <CardContent className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{conflicts.criticalConflicts}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{conflicts.totalConflicts - conflicts.criticalConflicts}</div>
                <div className="text-xs text-muted-foreground">Other</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{conflicts.autoResolvableConflicts}</div>
                <div className="text-xs text-muted-foreground">Auto-resolvable</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{resolvedConflicts.size}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
            </div>

            {/* Conflict List */}
            <div className="space-y-3">
              {activeConflicts.map((conflict) => (
                <Alert
                  key={conflict.id}
                  className={cn(
                    "border-l-4",
                    conflict.severity === 'critical' && "border-l-red-500 bg-red-50",
                    conflict.severity === 'high' && "border-l-orange-500 bg-orange-50",
                    conflict.severity === 'medium' && "border-l-yellow-500 bg-yellow-50",
                    conflict.severity === 'low' && "border-l-blue-500 bg-blue-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded bg-white/80">
                      {getConflictIcon(conflict.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(conflict.severity)}>
                          {conflict.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {conflict.type.toUpperCase()}
                        </Badge>
                        {conflict.autoResolvable && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            AUTO-RESOLVABLE
                          </Badge>
                        )}
                      </div>
                      <AlertDescription className="mb-2">
                        {conflict.description}
                      </AlertDescription>
                      <div className="text-sm text-muted-foreground mb-2">
                        <strong>Resolution:</strong> {conflict.resolution}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <strong>Affected Cases:</strong> {conflict.affectedCases.join(', ')}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveConflict(conflict.id)}
                      className="ml-auto"
                    >
                      Resolve
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>

            {/* Resolution Status */}
            {resolvedConflicts.size > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-medium text-green-800">
                    {resolvedConflicts.size} conflicts resolved
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  The system has automatically rescheduled affected cases to resolve conflicts.
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
