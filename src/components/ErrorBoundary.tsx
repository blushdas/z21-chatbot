 import React, { Component, ErrorInfo, ReactNode } from 'react';
 import { AlertTriangle, RefreshCw } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { logError } from '@/utils/errorLogger';
 
 interface Props {
   children: ReactNode;
   fallback?: ReactNode;
 }
 
 interface State {
   hasError: boolean;
   error: Error | null;
   errorInfo: ErrorInfo | null;
 }
 
 /**
  * Error Boundary component for catching React component errors
  * Displays a user-friendly fallback UI and logs errors centrally
  */
 class ErrorBoundary extends Component<Props, State> {
   constructor(props: Props) {
     super(props);
     this.state = {
       hasError: false,
       error: null,
       errorInfo: null,
     };
   }
 
   static getDerivedStateFromError(error: Error): Partial<State> {
     return { hasError: true, error };
   }
 
   componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
     this.setState({ errorInfo });
     
     // Log error centrally
     logError(error, {
       componentStack: errorInfo.componentStack,
       type: 'react_error_boundary',
     });
   }
 
   handleReload = (): void => {
     window.location.reload();
   };
 
   handleReset = (): void => {
     this.setState({
       hasError: false,
       error: null,
       errorInfo: null,
     });
   };
 
   render(): ReactNode {
     if (this.state.hasError) {
       // Custom fallback if provided
       if (this.props.fallback) {
         return this.props.fallback;
       }
 
       // Default fallback UI
       return (
         <div className="min-h-screen flex items-center justify-center bg-background p-4">
           <div className="max-w-md w-full text-center space-y-6">
             <div className="flex justify-center">
               <div className="p-4 rounded-full bg-destructive/10">
                 <AlertTriangle className="w-12 h-12 text-destructive" />
               </div>
             </div>
             
             <div className="space-y-2">
               <h1 className="text-2xl font-semibold text-foreground">
                 Something went wrong
               </h1>
               <p className="text-muted-foreground">
                 We're sorry, but something unexpected happened. Please try refreshing the page.
               </p>
             </div>
 
             <div className="flex flex-col sm:flex-row gap-3 justify-center">
               <Button
                 onClick={this.handleReload}
                 className="gap-2"
               >
                 <RefreshCw className="w-4 h-4" />
                 Refresh Page
               </Button>
               <Button
                 variant="outline"
                 onClick={this.handleReset}
               >
                 Try Again
               </Button>
             </div>
 
             {/* Show error details in development */}
             {process.env.NODE_ENV === 'development' && this.state.error && (
               <details className="mt-8 text-left bg-muted/50 p-4 rounded-lg overflow-auto max-h-64">
                 <summary className="cursor-pointer text-sm font-medium text-muted-foreground mb-2">
                   Error Details (Development Only)
                 </summary>
                 <pre className="text-xs text-destructive whitespace-pre-wrap break-words">
                   {this.state.error.toString()}
                   {this.state.errorInfo?.componentStack}
                 </pre>
               </details>
             )}
           </div>
         </div>
       );
     }
 
     return this.props.children;
   }
 }
 
 export default ErrorBoundary;